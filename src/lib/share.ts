const CODE_PATTERN = /^BACMODS-[A-Z0-9]{5}$/;

/**
 * Accepts a bare code ("BACMODS-7KQ2X") or a link ("https://…/?share=BACMODS-7KQ2X").
 * Returns the normalised code, or null when the input isn't shaped like one.
 */
export function parseShareInput(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  let candidate = text;
  try {
    const fromLink = new URL(text).searchParams.get("share");
    if (fromLink) candidate = fromLink;
  } catch {
    // Not a URL: treat it as a bare code.
  }
  candidate = candidate.trim().toUpperCase();
  return CODE_PATTERN.test(candidate) ? candidate : null;
}
