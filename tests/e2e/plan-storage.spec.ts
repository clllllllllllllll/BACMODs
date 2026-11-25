import { expect, test, type Page } from "@playwright/test";
import { startPlanningAt } from "./setup";

test.beforeEach(async ({ page }) => {
  await startPlanningAt(page, "/modules");
});

/** Hold the app's write lock so both tabs can enqueue edits before either saves. */
async function holdPlanWrites(page: Page) {
  await page.evaluate(() => new Promise<void>((acquired, reject) => {
    void navigator.locks.request("bacmods:plan", () => new Promise<void>((release) => {
      window.addEventListener("release-plan-writes", () => release(), { once: true });
      acquired();
    })).catch(reject);
  }));
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
    await expect.poll(() => page.evaluate(async () => {
      const { pending } = await navigator.locks.query();
      return pending?.filter(({ name }) => name === "bacmods:plan").length;
    })).toBe(4);
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

for (const lockFailure of ["Web Locks are unavailable", "the lock request is rejected before the edit"] as const) {
  test(`edits save across reload when ${lockFailure}`, async ({ page }) => {
    await page.addInitScript((failure) => {
      Object.defineProperty(window, "indexedDB", { value: undefined });
      if (failure === "Web Locks are unavailable") {
        Reflect.deleteProperty(Navigator.prototype, "locks");
      } else {
        navigator.locks.request = () => Promise.reject(new DOMException("Lock unavailable", "NotAllowedError"));
      }
    }, lockFailure);
    await page.goto("/modules");
    if (lockFailure === "Web Locks are unavailable") {
      expect(await page.evaluate(() => "locks" in navigator)).toBe(false);
    }
    await page.getByRole("button", { name: "Add INF2006" }).click();
    await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  });
}

test("a lock rejection after an edit starts does not apply it twice", async ({ page }) => {
  await page.addInitScript(() => {
    const request = navigator.locks.request.bind(navigator.locks);
    Object.defineProperty(navigator.locks, "request", {
      value: (name: string, callback: LockGrantedCallback<void>) => request(name, (lock) => {
        callback(lock);
        throw new Error("Lock failed after editing");
      }),
    });
  });
  await page.goto("/timetable");
  const failure = page.waitForEvent("pageerror", (error) => error.message === "Lock failed after editing");
  await page.getByRole("button", { name: "Next week" }).click();
  await failure;
  await expect(page.getByText("Week 2", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Week 2", { exact: true })).toBeVisible();
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
