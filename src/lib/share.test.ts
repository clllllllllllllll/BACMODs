import { describe, expect, it } from "vitest";
import { parseShareInput } from "@/lib/share";

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
