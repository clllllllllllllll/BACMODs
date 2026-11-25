import { expect, test, type Page } from "@playwright/test";

/** Hold the same transaction scope the app uses so both tabs can enqueue edits before either saves. */
async function holdPlanWrites(page: Page) {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("bacmods:plan-lock", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("writes");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = db.transaction("writes", "readwrite");
    const store = transaction.objectStore("writes");
    let held = true;
    window.addEventListener("release-plan-writes", () => { held = false; }, { once: true });
    transaction.oncomplete = () => db.close();

    await new Promise<void>((ready) => {
      function keepOpen() {
        store.get(0).onsuccess = () => {
          ready();
          if (held) keepOpen();
        };
      }
      keepOpen();
    });
  });
  return () => page.evaluate(() => window.dispatchEvent(new Event("release-plan-writes")));
}

async function switchIntake(page: Page, intake: string) {
  await page.getByRole("button", { name: /^Plan: BAC,/ }).click();
  const setup = page.getByRole("dialog", { name: "Your plan" });
  await setup.getByRole("combobox", { name: "Intake" }).selectOption(intake);
  await setup.getByRole("button", { name: "Update plan" }).click();
  await expect(setup).toBeHidden();
  await expect(page.getByRole("button", { name: `Plan: BAC, ${intake}, Y1T2. Change` })).toBeVisible();
}

test("overlapping additions and section picks survive in both tabs and after reload", async ({ page, context }) => {
  const second = await context.newPage();
  await Promise.all([page.goto("/modules"), second.goto("/modules")]);
  const lab = page.getByRole("region", { name: "INF1107" });
  const quiz = second.getByRole("region", { name: "INF1107" });
  await Promise.all([
    lab.getByRole("button", { name: /Laboratory · pick one/ }).click(),
    quiz.getByRole("button", { name: /Quiz · pick one/ }).click(),
  ]);

  const release = await holdPlanWrites(page);
  try {
    await Promise.all([
      lab.locator("label", { hasText: "P2" }).click(),
      quiz.locator("label", { hasText: "Q2" }).click(),
    ]);
    await Promise.all([
      page.getByRole("button", { name: "Add INF2006" }).click(),
      second.getByRole("button", { name: "Add BAC4000A" }).click(),
    ]);
    await expect(page.getByRole("button", { name: "Remove INF2006" })).toHaveCount(0);
    await expect(second.getByRole("button", { name: "Remove BAC4000A" })).toHaveCount(0);
  } finally {
    await release();
  }

  async function expectAllEdits(tab: Page) {
    const structures = tab.getByRole("region", { name: "INF1107" });
    await expect(structures.getByText("LAB P2", { exact: true })).toBeVisible();
    await expect(structures.getByText("QUIZ Q2", { exact: true })).toBeVisible();
    await expect(tab.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
    await expect(tab.getByRole("button", { name: "Remove BAC4000A" })).toBeVisible();
  }

  await Promise.all([expectAllEdits(page), expectAllEdits(second)]);
  await second.reload();
  await expectAllEdits(second);
  await page.getByRole("button", { name: "Remove BAC4000A" }).click();
  await expect(second.getByRole("button", { name: "Add BAC4000A" })).toBeVisible();
});

test("tabs can edit different intakes without switching or merging their plans", async ({ page, context }) => {
  const second = await context.newPage();
  await Promise.all([page.goto("/modules"), second.goto("/modules")]);
  await switchIntake(second, "AY25");
  await expect(page.getByRole("button", { name: /Plan: BAC, AY26/ })).toBeVisible();

  await second.getByRole("button", { name: "Add INF2006" }).click();
  await expect(second.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await page.getByRole("button", { name: "Add BAC4000A" }).click();
  await expect(page.getByRole("button", { name: "Remove BAC4000A" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add INF2006" })).toBeVisible();
  await expect(second.getByRole("button", { name: "Add BAC4000A" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /Plan: BAC, AY25/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await switchIntake(page, "AY26");
  await expect(page.getByRole("button", { name: "Remove BAC4000A" })).toBeVisible();
  await expect(second.getByRole("button", { name: /Plan: BAC, AY25/ })).toBeVisible();
});

test("edits save across reload when Web Locks are unavailable", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { value: undefined }));
  await page.goto("/modules");
  await page.getByRole("button", { name: "Add INF2006" }).click();
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
});

test("blocked writes stay usable and retry without discarding a peer tab’s edits", async ({ page, context }) => {
  const second = await context.newPage();
  await Promise.all([page.goto("/modules"), second.goto("/modules")]);
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException("Storage unavailable", "QuotaExceededError"); };
    window.addEventListener("restore-plan-storage", () => { Storage.prototype.setItem = setItem; }, { once: true });
  });
  await page.getByRole("button", { name: "Add INF2006" }).click();
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await switchIntake(page, "AY25");
  await switchIntake(page, "AY26");
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await expect(second.getByRole("button", { name: "Add INF2006" })).toBeVisible();

  await second.getByRole("button", { name: "Add BAC4000A" }).click();
  await expect(page.getByRole("button", { name: "Remove BAC4000A" })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("restore-plan-storage")));
  const structures = page.getByRole("region", { name: "INF1107" });
  await structures.getByRole("button", { name: /Laboratory · pick one/ }).click();
  await structures.locator("label", { hasText: "P2" }).click();
  await expect(second.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await second.reload();
  await expect(second.getByRole("button", { name: "Remove BAC4000A" })).toBeVisible();
  await expect(second.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await expect(second.getByRole("region", { name: "INF1107" }).getByText("LAB P2", { exact: true })).toBeVisible();
});
