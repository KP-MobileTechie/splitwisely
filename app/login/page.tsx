"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("Check your inbox for the magic link.");
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "1.75rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
          splitwisely
        </h1>
        <p style={{ color: "var(--fg-dim)", marginTop: 6, fontSize: ".95rem" }}>
          Split group expenses and settle up with the fewest payments.
        </p>

        {!configured ? (
          <div
            style={{
              marginTop: 18,
              padding: "0.9rem 1rem",
              borderRadius: 10,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              fontSize: ".9rem",
              color: "#9a3412",
              lineHeight: 1.5,
            }}
          >
            <strong>Setup needed.</strong> Supabase is not configured yet. The
            owner needs to create a Supabase project, run{" "}
            <code>supabase/schema.sql</code>, enable the Email auth provider, and
            set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: ".85rem", marginBottom: 6 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                borderRadius: 9,
                border: "1px solid var(--border)",
                fontSize: ".95rem",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "0.65rem",
                borderRadius: 9,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {message && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: ".88rem",
                  color: status === "error" ? "var(--danger)" : "var(--accent-dim)",
                }}
              >
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
