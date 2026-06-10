"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMember } from "@/app/(app)/actions";
import type { Member } from "@/lib/types";

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.1rem 1.25rem",
};

export function MemberList({
  groupId,
  members,
}: {
  groupId: string;
  members: Member[];
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addMember(groupId, name);
      if (result?.error) setError(result.error);
      else {
        setName("");
        router.refresh();
      }
    });
  }

  return (
    <section style={card}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
        Members ({members.length})
      </h2>
      {members.length > 0 && (
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            listStyle: "none",
            padding: 0,
            margin: "0 0 0.9rem",
          }}
        >
          {members.map((m) => (
            <li
              key={m.id}
              style={{
                padding: "0.3rem 0.7rem",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                fontSize: ".85rem",
              }}
            >
              {m.display_name}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add member by name"
          aria-label="Add member by name"
          style={{
            flex: 1,
            padding: "0.55rem 0.75rem",
            borderRadius: 9,
            border: "1px solid var(--border)",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.55rem 0.9rem",
            borderRadius: 9,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </form>
      {error && (
        <p style={{ color: "var(--danger)", fontSize: ".85rem", marginTop: 8 }}>
          {error}
        </p>
      )}
    </section>
  );
}
