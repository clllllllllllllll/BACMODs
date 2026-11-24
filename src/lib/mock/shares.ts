import { SharePayloadSchema, type SharePayload } from "@/lib/schemas/plan";
import { MOCK_SHARE_CODE } from "@/lib/mock/dataset";

/** Stand-in for server-side share-code storage (M6). Only one code exists in the shell. */
const MOCK_SHARES: Record<string, unknown> = {
  [MOCK_SHARE_CODE]: {
    programme: "BAC",
    intake: "AY26",
    term: "Y1T2",
    added: ["INF2006"],
    selection: {
      INF1105: { LTR: "ALL", TUT: "T2" },
      INF1107: { LEC: "ALL", LAB: "P3", QUIZ: "Q2" },
      INF2008: { LEC: "ALL", LAB: "ALL" },
      AAI1001: { LEC: "ALL", TUT: "ALL" },
      INF2006: { LEC: "ALL", LAB: "L1" },
    },
    colors: { INF1105: "blue", INF1107: "purple", INF2008: "green", AAI1001: "orange", INF2006: "pink" },
  },
};

export function lookupMockShare(code: string): SharePayload | null {
  const raw = MOCK_SHARES[code];
  if (!raw) return null;
  const parsed = SharePayloadSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
