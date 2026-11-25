import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const seriousViolations = violations
    .filter(({ impact }) => impact === "serious" || impact === "critical")
    .map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    }));
  expect(seriousViolations, "Serious and critical axe violations").toEqual([]);
}

// Scan each dialog once its contents are visible, with its opening animation disabled.
test.use({ reducedMotion: "reduce" });

test.describe("Accessibility", () => {
  test.skip(({ viewport }) => viewport?.width !== 390 && viewport?.width !== 1440,
    "Axe scans cover the 390 px mobile and 1440 px desktop projects");

  test("Setup", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Start planning" })).toBeVisible();
    await expectAccessible(page);
  });

  test("Modules", async ({ page, viewport }) => {
    await page.goto("/modules");
    await expect(page.getByRole("heading", { name: "Modules", level: 1 })).toBeVisible();
    if (viewport?.width === 1440) {
      await expect(page.getByRole("complementary", { name: "Week preview" })).toBeVisible();
    }
    await expectAccessible(page);
  });

  test("Timetable day view", async ({ page }) => {
    await page.goto("/timetable");
    await page.getByRole("button", { name: "Day", exact: true }).click();
    const monday = page.getByRole("tabpanel", { name: /^Monday/ });
    await expect(monday.getByText("INF1105", { exact: true })).toBeVisible();
    await expectAccessible(page);
  });

  test("Timetable week view", async ({ page }) => {
    await page.goto("/timetable");
    await page.getByRole("button", { name: "Week", exact: true }).click();
    const week = page.getByRole("group", { name: "Week timetable" });
    await expect(week.getByRole("img", { name: /^INF1105 LTR ALL/ })).toBeVisible();
    await expectAccessible(page);
  });

  test("Export", async ({ page }) => {
    await page.goto("/export");
    await expect(page.getByRole("button", { name: "Copy list" })).toBeEnabled();
    await expectAccessible(page);
  });

  test("open Setup sheet", async ({ page }) => {
    await page.goto("/modules");
    await page.getByRole("button", { name: /^Plan: BAC,/ }).click();
    const setup = page.getByRole("dialog", { name: "Your plan" });
    await expect(setup.getByRole("button", { name: "Update plan" })).toBeVisible();
    await expectAccessible(page);
  });

  test("open Share dialog", async ({ page }) => {
    await page.goto("/export");
    await page.getByRole("button", { name: /^Share code/ }).click();
    const share = page.getByRole("dialog", { name: "Share your plan" });
    await expect(share.getByRole("button", { name: "Copy share code" })).toBeVisible();
    await expectAccessible(page);
  });
});
