"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/app/(app)/actions";

export function NewGroupForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createGroup(name);
      if (result?.error) setError(result.error);
      else {
        setName("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New group name (e.g. Lake trip)"
        aria-label="New group name"
        style={{
          flex: 1,
          padding: "0.6rem 0.75rem",
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      />
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "0.6rem 1rem",
          borderRadius: 9,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {pending ? "Creating…" : "Create"}
      </button>
      {error && (
        <span style={{ color: "var(--danger)", fontSize: ".85rem", alignSelf: "center" }}>
          {error}
        </span>
      )}
    </form>
  );
}
