import { formatCents } from "@/lib/money";
import type { Transfer } from "@/lib/settle";

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.1rem 1.25rem",
};

export function SettleUpPanel({
  transfers,
  nameOf,
}: {
  transfers: Transfer[];
  nameOf: (memberId: string) => string;
}) {
  return (
    <section style={{ ...card, borderColor: "var(--accent)" }}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 0.4rem" }}>Settle up</h2>
      <p style={{ color: "var(--fg-dim)", fontSize: ".82rem", margin: "0 0 0.75rem" }}>
        The fewest payments that clear every balance.
      </p>
      {transfers.length === 0 ? (
        <p style={{ color: "var(--fg-dim)", fontSize: ".9rem", margin: 0 }}>
          Nothing to settle.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {transfers.map((t, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.5rem 0.7rem",
                background: "var(--bg)",
                borderRadius: 9,
              }}
            >
              <span>
                <strong>{nameOf(t.fromId)}</strong> pays{" "}
                <strong>{nameOf(t.toId)}</strong>
              </span>
              <span style={{ fontWeight: 700, color: "var(--accent-dim)" }}>
                {formatCents(t.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
