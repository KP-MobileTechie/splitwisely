// Pure split logic. All amounts are integer cents.

/**
 * Split a total equally into n shares that sum exactly to the total.
 * The remainder cents are distributed to the first members (deterministic).
 * e.g. splitEqual(100, 3) -> [34, 33, 33]
 */
export function splitEqual(totalCents: number, n: number): number[] {
  if (n <= 0) throw new Error("splitEqual: n must be positive");
  const base = Math.floor(totalCents / n);
  let remainder = totalCents - base * n;
  const shares: number[] = [];
  for (let i = 0; i < n; i++) {
    shares.push(base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  return shares;
}

export interface ExactValidation {
  ok: boolean;
  error?: string;
}

/**
 * Validate that exact split amounts sum to the total and match member count.
 */
export function validateExact(
  totalCents: number,
  amounts: number[]
): ExactValidation {
  if (amounts.length === 0) {
    return { ok: false, error: "Add at least one member to the split." };
  }
  if (amounts.some((a) => !Number.isInteger(a) || a < 0)) {
    return { ok: false, error: "Each amount must be zero or more." };
  }
  const sum = amounts.reduce((t, a) => t + a, 0);
  if (sum !== totalCents) {
    return {
      ok: false,
      error: `Split amounts must add up to the total (${sum} of ${totalCents} cents).`,
    };
  }
  return { ok: true };
}
