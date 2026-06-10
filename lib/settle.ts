// Debt-simplification settle-up algorithm. Pure, deterministic, integer cents.

export interface Balance {
  memberId: string;
  netCents: number; // positive = is owed money, negative = owes money
}

export interface Transfer {
  fromId: string; // debtor pays
  toId: string; // creditor receives
  amountCents: number;
}

export interface SettleExpense {
  paidBy: string;
  amountCents: number;
  splits: { memberId: string; amountCents: number }[];
}

/**
 * Compute each member's net balance across a group's expenses.
 * net = total paid by member - total the member owes (from splits).
 * The returned balances always sum to zero.
 */
export function netBalances(
  expenses: SettleExpense[],
  memberIds: string[]
): Balance[] {
  const net = new Map<string, number>();
  for (const id of memberIds) net.set(id, 0);

  for (const expense of expenses) {
    net.set(expense.paidBy, (net.get(expense.paidBy) ?? 0) + expense.amountCents);
    for (const split of expense.splits) {
      net.set(
        split.memberId,
        (net.get(split.memberId) ?? 0) - split.amountCents
      );
    }
  }

  return memberIds.map((memberId) => ({
    memberId,
    netCents: net.get(memberId) ?? 0,
  }));
}

/**
 * Greedy minimum-cash-flow debt simplification.
 * Repeatedly settle the largest creditor against the largest debtor.
 * Produces at most n-1 transfers. Stable tie-break by memberId for determinism.
 */
export function simplifyDebts(balances: Balance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.netCents - a.netCents || cmp(a.memberId, b.memberId));
  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.netCents - b.netCents || cmp(a.memberId, b.memberId));

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.netCents, -debtor.netCents);

    if (amount > 0) {
      transfers.push({
        fromId: debtor.memberId,
        toId: creditor.memberId,
        amountCents: amount,
      });
      creditor.netCents -= amount;
      debtor.netCents += amount;
    }

    if (creditor.netCents === 0) ci++;
    if (debtor.netCents === 0) di++;
  }

  return transfers;
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
