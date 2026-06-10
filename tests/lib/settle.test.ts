import { describe, it, expect } from "vitest";
import {
  netBalances,
  simplifyDebts,
  type Balance,
  type SettleExpense,
} from "@/lib/settle";

describe("netBalances", () => {
  it("computes paid minus owed per member and sums to zero", () => {
    const members = ["a", "b", "c"];
    const expenses: SettleExpense[] = [
      {
        paidBy: "a",
        amountCents: 900,
        splits: [
          { memberId: "a", amountCents: 300 },
          { memberId: "b", amountCents: 300 },
          { memberId: "c", amountCents: 300 },
        ],
      },
    ];
    const balances = netBalances(expenses, members);
    expect(balances).toEqual([
      { memberId: "a", netCents: 600 },
      { memberId: "b", netCents: -300 },
      { memberId: "c", netCents: -300 },
    ]);
    expect(balances.reduce((t, b) => t + b.netCents, 0)).toBe(0);
  });

  it("returns zeros for a group with no expenses", () => {
    expect(netBalances([], ["a", "b"])).toEqual([
      { memberId: "a", netCents: 0 },
      { memberId: "b", netCents: 0 },
    ]);
  });
});

describe("simplifyDebts", () => {
  it("settles a two-party debt with one transfer", () => {
    const balances: Balance[] = [
      { memberId: "a", netCents: 500 },
      { memberId: "b", netCents: -500 },
    ];
    expect(simplifyDebts(balances)).toEqual([
      { fromId: "b", toId: "a", amountCents: 500 },
    ]);
  });

  it("returns no transfers when already settled", () => {
    expect(
      simplifyDebts([
        { memberId: "a", netCents: 0 },
        { memberId: "b", netCents: 0 },
      ])
    ).toEqual([]);
  });

  it("simplifies a three-party case within the n-1 bound", () => {
    const balances: Balance[] = [
      { memberId: "a", netCents: 600 },
      { memberId: "b", netCents: -300 },
      { memberId: "c", netCents: -300 },
    ];
    const transfers = simplifyDebts(balances);
    expect(transfers.length).toBeLessThanOrEqual(2);
    // every debtor is fully covered, every creditor fully paid
    expectSettled(balances, transfers);
  });

  it("handles uneven remainders and stays balanced", () => {
    const balances: Balance[] = [
      { memberId: "a", netCents: 334 },
      { memberId: "b", netCents: -167 },
      { memberId: "c", netCents: -167 },
    ];
    const transfers = simplifyDebts(balances);
    expectSettled(balances, transfers);
  });

  it("is deterministic for the same input", () => {
    const balances: Balance[] = [
      { memberId: "x", netCents: 1000 },
      { memberId: "y", netCents: -400 },
      { memberId: "z", netCents: -600 },
    ];
    expect(simplifyDebts(balances)).toEqual(simplifyDebts(balances));
  });
});

function expectSettled(balances: Balance[], transfers: ReturnType<typeof simplifyDebts>) {
  const net = new Map(balances.map((b) => [b.memberId, b.netCents]));
  for (const t of transfers) {
    net.set(t.fromId, (net.get(t.fromId) ?? 0) + t.amountCents);
    net.set(t.toId, (net.get(t.toId) ?? 0) - t.amountCents);
  }
  for (const v of net.values()) expect(v).toBe(0);
}
