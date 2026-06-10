// Integer-cents money helpers. Never use float arithmetic for money.

const MAX_CENTS = 1_000_000_000; // $10M cap, guards overflow / typos

/**
 * Parse a dollars string ("12.34") into integer cents (1234).
 * Returns null for invalid, negative, NaN, or oversized values.
 */
export function parseAmount(input: string): number | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;
  // Accept optional dollar sign, digits, optional 1-2 decimal places.
  if (!/^\$?\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const numeric = Number(trimmed.replace("$", ""));
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  const cents = Math.round(numeric * 100);
  if (cents <= 0 || cents > MAX_CENTS) return null;
  return cents;
}

/** Format integer cents as a display string ("$12.34"). */
export function formatCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const remainder = (abs % 100).toString().padStart(2, "0");
  return `${negative ? "-" : ""}$${dollars.toLocaleString("en-US")}.${remainder}`;
}

/** Sum an array of integer cents. */
export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
