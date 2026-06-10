import { describe, it, expect } from "vitest";
import { parseAmount, formatCents, sumCents } from "@/lib/money";

describe("parseAmount", () => {
  it("parses dollars and cents to integer cents", () => {
    expect(parseAmount("12.34")).toBe(1234);
    expect(parseAmount("0.05")).toBe(5);
    expect(parseAmount("100")).toBe(10000);
    expect(parseAmount("$9.99")).toBe(999);
    expect(parseAmount("  5.5 ")).toBe(550);
  });

  it("rejects invalid, negative, zero and oversized values", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("1.234")).toBeNull();
    expect(parseAmount("99999999999")).toBeNull();
    expect(parseAmount("NaN")).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats integer cents as a currency string", () => {
    expect(formatCents(1234)).toBe("$12.34");
    expect(formatCents(5)).toBe("$0.05");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(100000)).toBe("$1,000.00");
    expect(formatCents(-500)).toBe("-$5.00");
  });
});

describe("sumCents", () => {
  it("sums an array of cents", () => {
    expect(sumCents([100, 200, 300])).toBe(600);
    expect(sumCents([])).toBe(0);
    expect(sumCents([-50, 50])).toBe(0);
  });
});
