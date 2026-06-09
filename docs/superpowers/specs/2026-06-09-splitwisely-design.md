# splitwisely — Design Spec

**Date:** 2026-06-09 · **Status:** Approved (brainstorming) · **Repo:** `D:\Projects\splitwisely` · Vercel · public `KP-MobileTechie/splitwisely`

## Summary
A group expense splitter. Create groups, add members, log expenses (who paid, split equal or exact), see each person's net balance, and get a **debt-simplification** settle-up plan that minimizes the number of payments. Real backend: Supabase Postgres with email magic-link auth and Row-Level Security so users only see their own groups. Sixth and final project: the full-stack + security + algorithm capstone.

## Decisions (locked)
| Decision | Choice | Why |
|---|---|---|
| Backend | Supabase Postgres + Auth (magic link) + RLS | Real full-stack + security proof; the portfolio's missing piece. |
| Auth | Supabase email magic-link via `@supabase/ssr` (cookie sessions, middleware) | Modern SSR session pattern; no password handling. |
| Algorithm | Debt simplification (greedy min cash flow) + per-expense splits | The whiteboard centerpiece; pure + fully unit-tested. |
| Splits | Equal (remainder distributed) or exact amounts (must sum to total) | Covers real use; pure validation logic. |
| Persistence | Supabase only (no localStorage) | This project is about a real DB. |
| Stack | Next.js App Router + TypeScript + Tailwind + `@supabase/supabase-js` + `@supabase/ssr` + Vitest | Portfolio-consistent. |
| Commits | Real dates from Jun 9 2026, author `krunal85 <kp587372@gmail.com>`, no AI attribution | Owner instruction. |

## Architecture
```
app/layout.tsx              fonts, metadata, theme
app/login/page.tsx          email magic-link sign-in
app/auth/confirm/route.ts   magic-link callback → set session cookie
app/(app)/page.tsx          groups list + create group
app/(app)/groups/[id]/page.tsx  group detail: members, expenses, balances, settle-up
app/(app)/layout.tsx        requires session (redirect to /login)
middleware.ts               refresh Supabase session cookie on every request
lib/supabase/server.ts      server client (cookies) via @supabase/ssr
lib/supabase/client.ts      browser client
lib/settle.ts               PURE: netBalances(expenses) + simplifyDebts(balances) → transfers   (tested)
lib/split.ts                PURE: splitEqual(total, members) + validateExact(total, amounts)      (tested)
lib/money.ts                PURE: integer-cents helpers (parse, format, sum)                       (tested)
components/                 GroupList · NewGroupForm · MemberList · ExpenseForm · ExpenseList · BalancePanel · SettleUpPanel
supabase/schema.sql         tables + RLS policies (owner runs once)
tests/lib/*.test.ts         settle, split, money (~22 tests)
.github/workflows/ci.yml    test + build
```

**Data model (cents as integers everywhere):**
- `groups (id uuid pk, name text, created_by uuid → auth.users, created_at)`
- `group_members (id uuid pk, group_id → groups, user_id uuid null, display_name text, created_at)` — members are names; optionally linked to an auth user
- `expenses (id uuid pk, group_id → groups, description text, amount_cents int, paid_by → group_members, split_kind text 'equal'|'exact', created_by uuid, created_at)`
- `expense_splits (id uuid pk, expense_id → expenses, member_id → group_members, amount_cents int)`

**RLS:** every table policy checks the row's group belongs to a group the current `auth.uid()` created (v1: creator-owns-group model — `groups.created_by = auth.uid()`, children joined through `group_id`). Documented as the simplest correct RLS; multi-user shared groups are a v2 note.

**Data flow:** server components read via the SSR Supabase client (RLS-scoped to the session). Mutations (create group, add member, add expense) are **Server Actions** that insert and `revalidatePath`. Balances + settle-up are computed in pure `lib/` from the group's expenses, on the server, and rendered.

**The algorithm (`lib/settle.ts`, README centerpiece):**
- `netBalances(expenses)`: per member, sum(paid) − sum(owed-from-splits) → net cents (positive = is owed, negative = owes). Sums to zero.
- `simplifyDebts(balances)`: greedy min-cash-flow — repeatedly match the largest creditor with the largest debtor, settle min(|amounts|), recurse. Produces at most n−1 transfers. Pure, deterministic (stable ordering), fully tested incl. already-settled, two-party, multi-party, rounding-remainder cases.

## Key behaviors
- Magic-link login; signed-out users hitting an app route redirect to `/login`; sign-out clears session.
- Create group → appears in list. Open group → add members (names), add expenses (description, amount, payer, split equal or exact among selected members).
- Equal split distributes the remainder cents deterministically (first members get the extra cent); exact split must sum to the total or the form rejects.
- Balance panel shows each member's net; settle-up panel shows the minimized "X pays Y $Z" transfers.
- All money in integer cents; display formatted; never float arithmetic.

## Error handling / edge cases
- Supabase env missing at build → app builds; runtime shows a setup notice on the login page (no crash).
- Auth error / expired link → friendly message on /login.
- Exact split not summing to total → inline form error, no insert.
- Empty group (no expenses) → balances all zero, settle-up empty state.
- RLS denies cross-user access → server query returns nothing → 404/empty, never another user's data.
- Negative/zero/oversized amounts → validated in `lib/money` + form.

## Testing (Vitest, ~22 pure tests)
- `money.ts`: parse "12.34" → 1234, format, sum, reject NaN/negative.
- `split.ts`: equal split sums to total + remainder distribution deterministic; exact validation (sum match, count match).
- `settle.ts`: netBalances sums to zero; simplifyDebts on two-party, three-party cycle, already-settled (no transfers), n−1 bound, remainder. The DB/auth/RLS layer is verified manually + live, not unit-tested.

## Configuration / owner setup (one-time)
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both public-safe; RLS enforces access).
- Owner: create a free Supabase project → run `supabase/schema.sql` in the SQL editor (creates tables + RLS + enables email auth) → set the two env vars locally and in Vercel → enable Email auth provider. The app builds without these; auth/data require them.

## Out of scope (v2)
Shared multi-user groups with invitations, recurring expenses, currencies/FX, receipts/images, partial settlements tracking, push notifications.

## Delivery
Public repo, Vercel deploy, CI, README (demo GIF placeholder, "How it works" on the debt-simplification algorithm + RLS, 3 decisions, schema + setup steps). Commits real-dated Jun 9 2026+, krunal85, no AI attribution. README has no em dashes.
