import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No env yet: send people to the login page's setup notice.
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={{ minHeight: "100dvh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.9rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textDecoration: "none",
            color: "var(--fg)",
          }}
        >
          splitwisely
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: ".82rem", color: "var(--fg-dim)" }}>
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              style={{
                fontSize: ".82rem",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0.35rem 0.7rem",
                cursor: "pointer",
                color: "var(--fg)",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "1.75rem 1.25rem 4rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}
