import { formatCents } from "@/lib/money";
import type { Balance } from "@/lib/settle";

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.1rem 1.25rem",
};

export function BalancePanel({
  balances,
  nameOf,
}: {
  balances: Balance[];
  nameOf: (memberId: string) => string;
}) {
  const nonZero = balances.filter((b) => b.netCents !== 0);

  return (
    <section style={card}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>Balances</h2>
      {nonZero.length === 0 ? (
        <p style={{ color: "var(--fg-dim)", fontSize: ".9rem", margin: 0 }}>
          Everyone is even.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {balances.map((b) => {
            const owed = b.netCents > 0;
            return (
              <li
                key={b.memberId}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>{nameOf(b.memberId)}</span>
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      b.netCents === 0
                        ? "var(--fg-dim)"
                        : owed
                        ? "var(--accent-dim)"
                        : "var(--danger)",
                  }}
                >
                  {b.netCents === 0
                    ? "even"
                    : owed
                    ? `is owed ${formatCents(b.netCents)}`
                    : `owes ${formatCents(-b.netCents)}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
