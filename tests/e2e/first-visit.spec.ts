import { expect, test } from "@playwright/test";

test.describe("before the browser reads the saved plan", () => {
  test.use({ javaScriptEnabled: false });

  test("Export renders the public header and withholds planner controls", async ({ page }) => {
    await page.goto("/export");
    await expect(page.getByRole("banner").getByRole("link", { name: "BACMODS" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy list" })).toHaveCount(0);
  });
});

for (const path of ["/export", "/modules", "/timetable"]) {
  test(`a first visit to ${path} requires Setup, then restores the destination`, async ({ page }) => {
    const destination = path + "?from=bookmark#saved";
    await page.goto(destination);
    await expect(page).toHaveURL(url => url.pathname === "/" && url.searchParams.get("next") === destination);
    await expect(page.getByRole("button", { name: /^Plan: BAC,/ })).toHaveCount(0);
    await page.getByRole("combobox", { name: "Intake" }).selectOption("AY25");
    await page.getByRole("button", { name: "Start planning" }).click();
    await expect(page).toHaveURL(destination);
    await page.reload();
    await expect(page.getByRole("button", { name: /Plan: BAC, AY25/ })).toBeVisible();
    await expect(page).toHaveURL(destination);
  });
}

test("an invalid share leaves Setup open and a valid code opens the requested page", async ({ page }) => {
  await page.goto("/export?share=BACMODS-ZZZZZ");
  const input = page.getByRole("textbox", { name: "Share code" });
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Copy list" })).toHaveCount(0);
  await input.fill("BACMODS-7KQ2X");
  await page.getByRole("button", { name: "Load plan" }).click();
  await expect(page).toHaveURL("/export");
  await expect(page.getByRole("listitem").filter({ hasText: "INF2006" })).toBeVisible();
});

test("a shared planner link imports the plan and skips manual setup", async ({ page }) => {
  await page.goto("/export?share=BACMODS-7KQ2X");
  await expect(page).toHaveURL("/export");
  await expect(page.getByRole("listitem").filter({ hasText: "INF2006" })).toBeVisible();
});

test("a damaged active plan does not count as setup", async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'bacmods:plan:v2:["BAC","AY26","Y1T2"]';
    localStorage.setItem("bacmods:plan:v2:active", key);
    localStorage.setItem(key, '{"programme":');
  });
  await page.goto("/export");
  await expect(page.getByRole("button", { name: "Start planning" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy list" })).toHaveCount(0);
});

test("setup works for the current tab when storage writes are blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage unavailable", "QuotaExceededError"); };
  });
  await page.goto("/export");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page.getByRole("button", { name: "Copy list" })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "Start planning" })).toBeVisible();
});

test("a return parameter cannot send the student to another origin", async ({ page }) => {
  await page.goto("/?next=%2F%2Fexample.invalid");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page).toHaveURL("/modules");
});
