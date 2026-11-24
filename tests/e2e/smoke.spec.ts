import { expect, test } from "@playwright/test";

// Walks the S1 shell at 390 px: setup → modules → timetable → export.
// Mock data only. Run against the Docker container: `docker compose up --build -d`.
test("setup → modules → timetable → export", async ({ page }) => {
  // Setup
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Plan your BAC timetable" })).toBeVisible();
  await page.getByRole("button", { name: "Start planning" }).click();

  // Modules
  await expect(page).toHaveURL(/\/modules$/);
  await expect(page.getByRole("heading", { name: "Modules", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Modules" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("No optional modules in Y1T2.")).toBeVisible();

  // Pick a different lab section for INF1107
  await page.getByRole("button", { name: /Laboratory · pick one/ }).click();
  // The radio is visually hidden; a student taps its label.
  await page.locator("label", { hasText: "P2" }).click();
  await expect(page.getByRole("radio", { name: /P2/ })).toBeChecked();

  // Add a module that clashes with INF1107's lecture
  await page.getByRole("button", { name: "Add BAC4000A" }).click();
  await expect(page.getByRole("button", { name: "Remove BAC4000A" })).toBeVisible();

  // Timetable: clash status, week view, week switching
  await page.getByRole("link", { name: "Timetable" }).click();
  await expect(page).toHaveURL(/\/timetable$/);
  await expect(page.getByText(/Clash: 1 overlap/)).toBeVisible();
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.getByRole("group", { name: "Week timetable" })).toBeVisible();
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page.getByText("Week 2")).toBeVisible();

  // Export: section list reflects the picks, share sheet opens and closes
  await page.getByRole("link", { name: "Export" }).click();
  await expect(page).toHaveURL(/\/export$/);
  // Previous routes stay mounted but hidden (Activity), so query by role to see only the visible page.
  await expect(page.getByRole("listitem").filter({ hasText: "INF1107" }).getByText("LAB P2")).toBeVisible();
  await page.getByRole("button", { name: /^Share code/ }).click();
  const sheet = page.getByRole("dialog", { name: "Share your plan" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("BACMODS-7KQ2X")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("an unknown share code shows the error state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Share code" }).fill("BACMODS-ZZZZZ");
  await page.getByRole("button", { name: "Load plan" }).click();
  await expect(page.getByText("That code doesn't match a saved plan. Check it and try again.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Share code" })).toHaveAttribute("aria-invalid", "true");
});

test("a known share code loads that plan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Share code" }).fill("bacmods-7kq2x");
  await page.getByRole("button", { name: "Load plan" }).click();
  await expect(page).toHaveURL(/\/modules$/);
  // The shared plan includes INF2006 as an added module.
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
});
