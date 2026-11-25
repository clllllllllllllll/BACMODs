import { describe, expect, it } from "vitest";
import { makeInitialPlan } from "@/lib/plan";
import { addModule, pickSection, removeModule, replayEdits, setView, stepWeek } from "@/lib/plan-edits";
import type { Module, Session, TermDataset } from "@/lib/schemas/dataset";

function fakeModule(code: string): Module {
  const sessions: Session[] = [{ day: 1, start: "09:00", end: "10:00", venue: "Fictional room", weeks: [1] }];
  return {
    code,
    title: "Synthetic module",
    credits: 1,
    sections: [
      { id: "ALL", lessonType: "LEC", sessions },
      { id: "P1", lessonType: "LAB", sessions },
      { id: "P2", lessonType: "LAB", sessions },
    ],
  };
}

const curriculumContext = { programme: "BAC", intakeAy: 2099, year: 1, trimester: "T1" } as const;
const moduleCodes = ["FAKEREQUIRED", "FAKEELECTIVE", "FAKEADDED", "FAKEPEER", "FAKEPENDING"];
const dataset: TermDataset = {
  ay: 2099,
  trimester: "T1",
  version: "synthetic",
  publishedOn: "2099-01-01",
  calendar: { week1Monday: "2099-01-05", teachingWeeks: 4, recessAfterWeeks: [] },
  modules: Object.fromEntries(moduleCodes.map((code) => [code, fakeModule(code)])),
  curriculum: [
    { ...curriculumContext, code: "FAKEREQUIRED", kind: "mandatory" },
    { ...curriculumContext, code: "FAKEELECTIVE", kind: "elective" },
  ],
};

const makePlan = () => makeInitialPlan(dataset, "AY99", "Y1T1");

describe("addModule", () => {
  it("normalises the code and gives the module default sections and the next unused colour", () => {
    const plan = makePlan();
    const added = addModule(plan, dataset, " fake added ");

    expect(added.added).toEqual(["FAKEADDED"]);
    expect(added.selection.FAKEADDED).toEqual({ LEC: "ALL", LAB: "P1" });
    expect(added.colors).toEqual({ ...plan.colors, FAKEADDED: "green" });
    expect(plan.added).toEqual([]);
  });

  it("returns the same plan for unknown modules and duplicates", () => {
    const plan = addModule(makePlan(), dataset, "FAKEADDED");

    expect(addModule(plan, dataset, "FAKEUNKNOWN")).toBe(plan);
    expect(addModule(plan, dataset, "fake added")).toBe(plan);
    expect(addModule(plan, dataset, "FAKEREQUIRED")).toBe(plan);
  });
});

describe("removeModule", () => {
  it("removes the added module's selections and colour", () => {
    const initial = makePlan();
    const plan = addModule(initial, dataset, "FAKEADDED");

    expect(removeModule(plan, dataset, "fake added")).toEqual(initial);
    expect(plan.added).toEqual(["FAKEADDED"]);
  });

  it("returns the same plan for an absent module or a protected curriculum module", () => {
    const plan = { ...makePlan(), added: ["FAKEREQUIRED", "FAKEELECTIVE"] };

    expect(removeModule(plan, dataset, "FAKEADDED")).toBe(plan);
    expect(removeModule(plan, dataset, "FAKEREQUIRED")).toBe(plan);
    expect(removeModule(plan, dataset, "FAKEELECTIVE")).toBe(plan);
  });
});

describe("pickSection", () => {
  it("updates only the chosen lesson type", () => {
    const plan = makePlan();
    const picked = pickSection(plan, dataset, "fake required", "LAB", "P2");

    expect(picked.selection).toEqual({ ...plan.selection, FAKEREQUIRED: { LEC: "ALL", LAB: "P2" } });
    expect(plan.selection.FAKEREQUIRED.LAB).toBe("P1");
  });

  it("returns the same plan if the module is absent or the section is already picked", () => {
    const plan = makePlan();

    expect(pickSection(plan, dataset, "FAKEADDED", "LAB", "P2")).toBe(plan);
    expect(pickSection(plan, dataset, "FAKEREQUIRED", "LAB", "P1")).toBe(plan);
  });
});

describe("setView", () => {
  it("replaces the view only if it changes", () => {
    const plan = makePlan();

    expect(setView(plan, "auto")).toBe(plan);
    expect(setView(plan, "week")).toEqual({ ...plan, view: "week" });
  });
});

describe("stepWeek", () => {
  const lastWeek = dataset.calendar.teachingWeeks;

  it("steps within teaching weeks and returns the same plan at the bounds", () => {
    const first = makePlan();
    const last = { ...first, week: lastWeek };

    expect(stepWeek(first, -1, lastWeek)).toBe(first);
    expect(stepWeek(first, 1, lastWeek).week).toBe(2);
    expect(stepWeek(last, -1, lastWeek).week).toBe(lastWeek - 1);
    expect(stepWeek(last, 1, lastWeek)).toBe(last);
  });

  it("starts from the last teaching week when the saved week is higher", () => {
    const plan = { ...makePlan(), week: 99 };

    expect(stepWeek(plan, -1, lastWeek).week).toBe(lastWeek - 1);
    expect(stepWeek(plan, 1, lastWeek).week).toBe(lastWeek);
  });
});

describe("replayEdits", () => {
  it("replays pending edits in order while preserving a peer tab's addition and removal", () => {
    const original = addModule(makePlan(), dataset, "FAKEADDED");
    const peer = addModule(removeModule(original, dataset, "FAKEADDED"), dataset, "FAKEPEER");
    const rebased = replayEdits(peer, [
      (plan) => pickSection(plan, dataset, "FAKEADDED", "LAB", "P2"),
      (plan) => addModule(plan, dataset, "FAKEPENDING"),
      (plan) => pickSection(plan, dataset, "FAKEPENDING", "LAB", "P2"),
    ]);

    expect(rebased.added).toEqual(["FAKEPEER", "FAKEPENDING"]);
    expect(rebased.colors).toEqual({ ...peer.colors, FAKEPENDING: "orange" });
    expect(rebased.selection).toEqual({ ...peer.selection, FAKEPENDING: { LEC: "ALL", LAB: "P2" } });
  });

  it("returns the base plan when there are no effective edits", () => {
    const plan = makePlan();

    expect(replayEdits(plan, [])).toBe(plan);
    expect(replayEdits(plan, [(current) => removeModule(current, dataset, "FAKEADDED")])).toBe(plan);
  });
});
