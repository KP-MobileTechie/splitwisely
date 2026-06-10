import { describe, it, expect } from "vitest";
import { splitEqual, validateExact } from "@/lib/split";

describe("splitEqual", () => {
  it("splits evenly when divisible", () => {
    expect(splitEqual(900, 3)).toEqual([300, 300, 300]);
  });

  it("distributes remainder cents to the first members", () => {
    expect(splitEqual(100, 3)).toEqual([34, 33, 33]);
    expect(splitEqual(1000, 3)).toEqual([334, 333, 333]);
  });

  it("always sums exactly to the total", () => {
    for (const [total, n] of [
      [1234, 7],
      [999, 4],
      [101, 100],
    ] as const) {
      const shares = splitEqual(total, n);
      expect(shares).toHaveLength(n);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it("throws for non-positive n", () => {
    expect(() => splitEqual(100, 0)).toThrow();
  });
});

describe("validateExact", () => {
  it("accepts amounts that sum to the total", () => {
    expect(validateExact(1000, [500, 500])).toEqual({ ok: true });
    expect(validateExact(1000, [600, 250, 150])).toEqual({ ok: true });
  });

  it("rejects a mismatched sum", () => {
    const result = validateExact(1000, [500, 400]);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects empty and negative amounts", () => {
    expect(validateExact(1000, []).ok).toBe(false);
    expect(validateExact(1000, [1100, -100]).ok).toBe(false);
  });
});
