"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExpense } from "@/app/(app)/actions";
import { parseAmount } from "@/lib/money";
import { validateExact } from "@/lib/split";
import type { Member, SplitKind } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  borderRadius: 9,
  border: "1px solid var(--border)",
};

export function ExpenseForm({
  groupId,
  members,
}: {
  groupId: string;
  members: Member[];
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "");
  const [splitKind, setSplitKind] = useState<SplitKind>("equal");
  const [selected, setSelected] = useState<string[]>(members.map((m) => m.id));
  const [exact, setExact] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleMember(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountCents = parseAmount(amount);
    if (amountCents === null) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one member to split between.");
      return;
    }

    let exactAmounts: number[] | undefined;
    if (splitKind === "exact") {
      exactAmounts = selected.map((id) => parseAmount(exact[id] ?? "") ?? -1);
      if (exactAmounts.some((c) => c < 0)) {
        setError("Enter a valid exact amount for each selected member.");
        return;
      }
      const v = validateExact(amountCents, exactAmounts);
      if (!v.ok) {
        setError(v.error ?? "Exact amounts must sum to the total.");
        return;
      }
    }

    startTransition(async () => {
      const result = await addExpense(groupId, {
        description,
        amountCents,
        paidBy,
        splitKind,
        memberIds: selected,
        exactAmounts,
      });
      if (result?.error) setError(result.error);
      else {
        setDescription("");
        setAmount("");
        setExact({});
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (e.g. Dinner)"
        aria-label="Description"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (e.g. 42.50)"
          aria-label="Amount"
          inputMode="decimal"
          style={inputStyle}
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          aria-label="Paid by"
          style={inputStyle}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name} paid
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, fontSize: ".85rem" }}>
        <label style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <input
            type="radio"
            name="splitKind"
            checked={splitKind === "equal"}
            onChange={() => setSplitKind("equal")}
          />
          Equal
        </label>
        <label style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <input
            type="radio"
            name="splitKind"
            checked={splitKind === "exact"}
            onChange={() => setSplitKind("exact")}
          />
          Exact amounts
        </label>
      </div>

      <fieldset style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "0.6rem 0.8rem" }}>
        <legend style={{ fontSize: ".8rem", color: "var(--fg-dim)", padding: "0 4px" }}>
          Split between
        </legend>
        <div style={{ display: "grid", gap: 6 }}>
          {members.map((m) => (
            <label
              key={m.id}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".9rem" }}
            >
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggleMember(m.id)}
              />
              <span style={{ flex: 1 }}>{m.display_name}</span>
              {splitKind === "exact" && selected.includes(m.id) && (
                <input
                  value={exact[m.id] ?? ""}
                  onChange={(e) =>
                    setExact((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  placeholder="0.00"
                  aria-label={`Exact amount for ${m.display_name}`}
                  inputMode="decimal"
                  style={{ ...inputStyle, width: 90 }}
                />
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "0.6rem",
          borderRadius: 9,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {pending ? "Adding…" : "Add expense"}
      </button>
      {error && (
        <p style={{ color: "var(--danger)", fontSize: ".85rem", margin: 0 }}>{error}</p>
      )}
    </form>
  );
}
