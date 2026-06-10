import { formatCents } from "@/lib/money";
import type { Expense } from "@/lib/types";

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.1rem 1.25rem",
};

export function ExpenseList({
  expenses,
  nameOf,
}: {
  expenses: Expense[];
  nameOf: (memberId: string) => string;
}) {
  return (
    <section style={card}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
        Expenses ({expenses.length})
      </h2>
      {expenses.length === 0 ? (
        <p style={{ color: "var(--fg-dim)", fontSize: ".9rem", margin: 0 }}>
          No expenses yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {expenses.map((e) => (
            <li
              key={e.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                paddingBottom: 8,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>
                <strong>{e.description}</strong>
                <span style={{ color: "var(--fg-dim)", fontSize: ".82rem", marginLeft: 8 }}>
                  {nameOf(e.paid_by)} paid · {e.split_kind}
                </span>
              </span>
              <span style={{ fontWeight: 600 }}>{formatCents(e.amount_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
