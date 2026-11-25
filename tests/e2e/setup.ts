import { expect, type Page } from "@playwright/test";

/** Start through the same first-visit flow as a student opening a planner link. */
export async function startPlanningAt(page: Page, destination: string) {
  await page.goto(destination);
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page).toHaveURL(destination);
  await expect(page.getByRole("button", { name: /^Plan: BAC,/ })).toBeVisible();
}
