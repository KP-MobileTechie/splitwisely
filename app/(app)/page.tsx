import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Group } from "@/lib/types";
import { NewGroupForm } from "@/components/NewGroupForm";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("id, name, created_by, created_at")
    .order("created_at", { ascending: false });
  const groups = (data ?? []) as Group[];

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", letterSpacing: "-0.02em", margin: 0 }}>
        Your groups
      </h1>
      <p style={{ color: "var(--fg-dim)", marginTop: 6 }}>
        Create a group, add members, log expenses, and settle up.
      </p>

      <div style={{ marginTop: 18 }}>
        <NewGroupForm />
      </div>

      {groups.length === 0 ? (
        <p
          style={{
            marginTop: 24,
            color: "var(--fg-dim)",
            fontSize: ".95rem",
          }}
        >
          No groups yet. Create your first one above.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "20px 0 0",
            display: "grid",
            gap: 10,
          }}
        >
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                style={{
                  display: "block",
                  padding: "0.95rem 1.1rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 11,
                  textDecoration: "none",
                  color: "var(--fg)",
                  fontWeight: 600,
                }}
              >
                {group.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
