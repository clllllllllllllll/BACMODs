import { describe, expect, it } from "vitest";
import { parsePlan, type Plan } from "@/lib/schemas/plan";

describe("parsePlan", () => {
  const plan: Plan = {
    programme: "BAC",
    intake: "AY2099",
    term: "Y2T3",
    added: ["TESTELECTIVE9"],
    selection: { TESTELECTIVE9: { LAB: "TESTLAB1" } },
    colors: { TESTELECTIVE9: "pink" },
    view: "week",
    week: 3,
  };

  it("reads a valid saved plan", () => {
    expect(parsePlan(JSON.stringify(plan))).toEqual(plan);
  });

  it("loads the saved plan and drops an unknown field", () => {
    const stored = JSON.stringify({ ...plan, datasetVersion: "synthetic-v2" });
    expect(parsePlan(stored)).toStrictEqual(plan);
  });

  it("returns undefined for a missing field", () => {
    expect(parsePlan(JSON.stringify({ ...plan, week: undefined }))).toBeUndefined();
  });

  it("returns undefined for malformed JSON", () => {
    expect(parsePlan('{"programme":')).toBeUndefined();
  });
});
