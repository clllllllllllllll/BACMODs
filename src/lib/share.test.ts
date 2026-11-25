import { describe, expect, it } from "vitest";
import { lookupShare, makeShareRecord, parseShareInput } from "@/lib/share";
import type { SharePayload } from "@/lib/schemas/plan";

describe("parseShareInput", () => {
  it("accepts a bare code, trimmed and uppercased", () => {
    expect(parseShareInput("  bacmods-7kq2x ")).toBe("BACMODS-7KQ2X");
  });
  it("accepts a share link", () => {
    expect(parseShareInput("https://example.test/?share=BACMODS-7KQ2X")).toBe("BACMODS-7KQ2X");
  });
  it("rejects anything else", () => {
    expect(parseShareInput("")).toBeNull();
    expect(parseShareInput("hello")).toBeNull();
    expect(parseShareInput("BACMODS-123")).toBeNull();
  });
});

describe("lookupShare", () => {
  const code = "BACMODS-ZZ999";
  const payload: SharePayload = {
    programme: "BAC",
    intake: "AY2099",
    term: "Y2T3",
    added: ["TESTELECTIVE9"],
    selection: { TESTCORE1: { LAB: "TESTLAB1", QUIZ: "TESTQUIZ1" }, TESTELECTIVE9: { LEC: "TESTLECTURE1" } },
    colors: { TESTCORE1: "green", TESTELECTIVE9: "pink" },
  };
  const records = { [code]: makeShareRecord(payload) };

  it("round-trips every share payload field through a stored record", () => {
    expect(lookupShare(code, JSON.parse(JSON.stringify(records)))).toEqual(payload);
  });

  it("loads the share payload and drops an unknown field", () => {
    const record = { ...records[code], payload: { ...payload, datasetVersion: "synthetic-v2" } };
    expect(lookupShare(code, { [code]: record })).toStrictEqual(payload);
  });

  it("rejects tampered and truncated codes", () => {
    expect(lookupShare("BACMODS-ZZ998", records)).toBeNull();
    expect(lookupShare("BACMODS-ZZ99", records)).toBeNull();
  });

  it("rejects a registered code with an unknown record version", () => {
    expect(lookupShare(code, { [code]: { ...records[code], version: 999 } })).toBeNull();
  });
});
