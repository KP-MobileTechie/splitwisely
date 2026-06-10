import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Group, Member, Expense, ExpenseSplit } from "@/lib/types";
import { netBalances, simplifyDebts, type SettleExpense } from "@/lib/settle";
import { MemberList } from "@/components/MemberList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { BalancePanel } from "@/components/BalancePanel";
import { SettleUpPanel } from "@/components/SettleUpPanel";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, created_by, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!group) notFound();

  const [{ data: memberData }, { data: expenseData }] = await Promise.all([
    supabase
      .from("group_members")
      .select("id, group_id, user_id, display_name, created_at")
      .eq("group_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, group_id, description, amount_cents, paid_by, split_kind, created_at")
      .eq("group_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const members = (memberData ?? []) as Member[];
  const expenses = (expenseData ?? []) as Expense[];

  const expenseIds = expenses.map((e) => e.id);
  let splits: ExpenseSplit[] = [];
  if (expenseIds.length > 0) {
    const { data: splitData } = await supabase
      .from("expense_splits")
      .select("id, expense_id, member_id, amount_cents")
      .in("expense_id", expenseIds);
    splits = (splitData ?? []) as ExpenseSplit[];
  }

  // Build the pure settle-up input and compute balances + transfers.
  const settleExpenses: SettleExpense[] = expenses.map((e) => ({
    paidBy: e.paid_by,
    amountCents: e.amount_cents,
    splits: splits
      .filter((s) => s.expense_id === e.id)
      .map((s) => ({ memberId: s.member_id, amountCents: s.amount_cents })),
  }));
  const balances = netBalances(settleExpenses, members.map((m) => m.id));
  const transfers = simplifyDebts(balances);
  const nameOf = (memberId: string) =>
    members.find((m) => m.id === memberId)?.display_name ?? "Unknown";

  const g = group as Group;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <Link
          href="/"
          style={{ fontSize: ".85rem", color: "var(--fg-dim)", textDecoration: "none" }}
        >
          ← All groups
        </Link>
        <h1 style={{ fontSize: "1.6rem", letterSpacing: "-0.02em", margin: "6px 0 0" }}>
          {g.name}
        </h1>
      </div>

      <MemberList groupId={g.id} members={members} />

      <section style={card}>
        <h2 style={heading}>Add an expense</h2>
        {members.length === 0 ? (
          <p style={{ color: "var(--fg-dim)", fontSize: ".9rem", margin: 0 }}>
            Add at least one member first.
          </p>
        ) : (
          <ExpenseForm groupId={g.id} members={members} />
        )}
      </section>

      <ExpenseList expenses={expenses} nameOf={nameOf} />

      <BalancePanel balances={balances} nameOf={nameOf} />

      <SettleUpPanel transfers={transfers} nameOf={nameOf} />
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.1rem 1.25rem",
};

const heading: React.CSSProperties = {
  fontSize: "1rem",
  margin: "0 0 0.75rem",
};
