import { describe, expect, it } from "vitest";
import { MOCK_DATASET } from "@/lib/mock/dataset";
import {
  clashesWithPlan,
  makeInitialPlan,
  nextColor,
  planClashes,
  sectionListLines,
  summarise,
} from "@/lib/plan";

const plan = () => makeInitialPlan(MOCK_DATASET, "AY26", "Y1T2");

describe("plan", () => {
  it("assigns colours in the documented order", () => {
    expect(plan().colors).toEqual({ INF1105: "blue", INF1107: "purple", INF2008: "green", AAI1001: "orange" });
  });
  it("wraps the colour order from the eighth module", () => {
    expect(nextColor(["blue", "purple", "green", "orange", "pink", "teal", "slate"])).toBe("blue");
  });
  it("starts clash-free on the default sections", () => {
    expect(planClashes(plan(), MOCK_DATASET).count).toBe(0);
  });
  it("flags the capstone seminar as clashing with the data structures lecture", () => {
    const p = plan();
    expect(clashesWithPlan(MOCK_DATASET.modules.BAC4000A.sections[0].sessions, p, MOCK_DATASET, { moduleCode: "BAC4000A" })).toBe(true);
  });
  it("reports a clash once the module is added", () => {
    const p = { ...plan(), added: ["BAC4000A"], colors: { ...plan().colors, BAC4000A: "pink" as const } };
    expect(planClashes(p, MOCK_DATASET).count).toBe(1);
  });
  it("summarises credits, days and earliest start", () => {
    expect(summarise(plan(), MOCK_DATASET)).toMatchObject({ credits: 15, earliestStart: "09:00", clashes: 0 });
  });
  it("lists chosen sections one line per module", () => {
    expect(sectionListLines(plan(), MOCK_DATASET)[1]).toEqual({
      code: "INF1107",
      line: "INF1107 LEC ALL · LAB P1 · QUIZ Q1",
    });
  });
});
