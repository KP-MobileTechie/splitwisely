# splitwisely Implementation Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Group expense splitter with Supabase (Postgres + magic-link auth + RLS), per-expense splits, and a debt-simplification settle-up algorithm. On Vercel.

**Architecture:** Next.js App Router. Pure logic in `lib/{money,split,settle}.ts` with Vitest (the algorithm centerpiece). Supabase via `@supabase/ssr` (cookie sessions, middleware); server components read RLS-scoped data; Server Actions mutate. Builds without live env (setup notice at runtime).

**Tech Stack:** Next.js 16 · TypeScript · Tailwind v4 · @supabase/supabase-js · @supabase/ssr · Vitest

**Spec:** `docs/superpowers/specs/2026-06-09-splitwisely-design.md`

## Commit rules (EVERY commit)
1. Plain messages, NEVER Co-Authored-By / Claude / AI attribution. Verify before push.
2. **First thing in Task 1 after scaffold: `git -C D:\Projects\splitwisely config user.name krunal85 && git config user.email kp587372@gmail.com`** (scaffold tools can reset git config — re-assert it). Confirm `git log -1 --format=%ae` = kp587372@gmail.com on every commit.
3. Real dates (today, Jun 9 2026+). No date env needed.

## Tasks
| # | Theme |
|---|---|
| 1 | scaffold + theme + Supabase install + schema.sql |
| 2 | lib/money + lib/split (TDD) |
| 3 | lib/settle: netBalances + simplifyDebts (TDD) |
| 4 | Supabase clients + middleware + auth (login, confirm route, app-layout guard) |
| 5 | groups: list + create (server action), group detail shell |
| 6 | members + expenses (add forms/server actions) + balances + settle-up panels |
| 7 | README/CI/repo/deploy |

---

### Task 1: Scaffold + theme + Supabase + schema
- Move docs aside; `npx create-next-app@latest D:\Projects\splitwisely --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes`; restore docs. Create AGENTS.md (copy D:\Projects\dropfour\AGENTS.md) + CLAUDE.md (`@AGENTS.md`).
- **Re-assert git config (see commit rules #2).**
- Install: `npm install @supabase/supabase-js @supabase/ssr`; dev `npm install -D vitest jsdom @vitejs/plugin-react`.
- `vitest.config.ts`: jsdom, include `tests/**/*.test.ts`, alias `@`→root, `pool: 'vmThreads'`. Scripts test/test:watch.
- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (empty until owner setup).
- `app/globals.css`: clean light theme — tokens --bg #f6f7f9, --surface #fff, --border, --fg, --fg-dim, --accent #16a34a (green, money), --focus; @theme inline; body; reduced-motion kill-switch.
- `app/layout.tsx`: Inter, metadata title "splitwisely — split group expenses, settle up simply".
- Placeholder `app/page.tsx`.
- `supabase/schema.sql`: create tables groups, group_members, expenses, expense_splits (per spec, cents as int); `alter table ... enable row level security`; RLS policies (creator-owns: `groups.created_by = auth.uid()`; children via `exists (select 1 from groups g where g.id = group_id and g.created_by = auth.uid())`); helpful indexes. Include a header comment: run in Supabase SQL editor, enable Email auth provider.
- Build clean. Commit `chore: scaffold Next.js + Tailwind, Supabase deps, schema and RLS`.

### Task 2: lib/money + lib/split (TDD)
- `lib/money.ts`: `parseAmount(s: string): number | null` (dollars string → integer cents; reject NaN/negative/>1e9); `formatCents(c): string` ("$12.34"); `sumCents(arr): number`.
- `lib/split.ts`: `splitEqual(totalCents, n): number[]` (n shares summing exactly to total; distribute remainder cents to the first members); `validateExact(totalCents, amounts: number[]): { ok: boolean; error?: string }` (sum must equal total).
- Tests `tests/lib/money.test.ts` + `tests/lib/split.test.ts`: parse/format/sum edge cases; equal split sums to total + deterministic remainder (e.g. 100c/3 → [34,33,33]); exact mismatch rejected. TDD red→green. Build clean.
- Commit `feat: money and split helpers`.

### Task 3: lib/settle (TDD)
- Types: `interface Balance { memberId: string; netCents: number }`, `interface Transfer { fromId: string; toId: string; amountCents: number }`.
- `netBalances(input)`: given expenses with `{ paidBy, amountCents }` and splits `{ memberId, amountCents }`, return `Balance[]` (paid − owed per member; sums to zero). Define a small input shape the tests construct directly.
- `simplifyDebts(balances: Balance[]): Transfer[]`: greedy — sort creditors (net>0) desc and debtors (net<0) by magnitude; repeatedly settle min(top creditor, top debtor); stable tie-break by memberId for determinism; ignore zero balances; returns ≤ n−1 transfers.
- Tests `tests/lib/settle.test.ts`: netBalances sums to zero; simplify two-party ([+500,-500] → one transfer); three-party cycle; already-settled (all zero → []); n−1 bound; remainder/uneven case; determinism (same input → same output). TDD. Build clean.
- Commit `feat: debt-simplification settle-up algorithm`.

### Task 4: Supabase clients + middleware + auth
- **Confirm @supabase/ssr v current API** (read node_modules/@supabase/ssr types): `createServerClient`/`createBrowserClient`, the cookies adapter shape for Next 16 (getAll/setAll), and middleware `updateSession` pattern. Follow the installed version exactly.
- `lib/supabase/server.ts` (server client from `cookies()`), `lib/supabase/client.ts` (browser). A helper `isSupabaseConfigured()` (both env vars present).
- `middleware.ts`: refresh session via @supabase/ssr; matcher excludes static assets.
- `app/login/page.tsx`: email input → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <origin>/auth/confirm } })`; success + error messaging; if `!isSupabaseConfigured()` show a setup notice instead of the form.
- `app/auth/confirm/route.ts`: handle the magic-link token (`verifyOtp` / code exchange per installed API) → redirect to `/`.
- `app/(app)/layout.tsx`: server component; `getUser()`; if no user redirect to `/login`; render a header with sign-out (server action calling `supabase.auth.signOut()`).
- Build/tsc/eslint clean (auth can't be exercised without env — verify it compiles + the unconfigured notice renders). Commit `feat: Supabase auth with magic link, middleware and route guard`.

### Task 5: groups list + create + detail shell
- Move placeholder `app/page.tsx` logic into `app/(app)/page.tsx`: server component reads `groups` (RLS-scoped) → `GroupList`; `NewGroupForm` (client) calls a Server Action `createGroup(name)` that inserts `{ name, created_by: user.id }` and `revalidatePath('/')`.
- `app/(app)/groups/[id]/page.tsx`: server component loads the group + members + expenses (RLS-scoped); 404 if not found; renders shells (MemberList, ExpenseList, BalancePanel, SettleUpPanel) — panels can be empty-state for now.
- Components GroupList, NewGroupForm. Build/tsc/eslint clean. Commit `feat: groups list, create and group detail shell`.

### Task 6: members + expenses + balances + settle-up
- Server Actions: `addMember(groupId, displayName)`, `addExpense(groupId, { description, amountCents, paidBy, splitKind, memberIds, exactAmounts? })` — inserts the expense + computed `expense_splits` rows (equal via `splitEqual`, or exact after `validateExact`), `revalidatePath`.
- Components: `MemberList` + add-member form; `ExpenseForm` (description, amount via parseAmount, payer select, split kind toggle, member multiselect, exact-amount inputs when exact; client-side validate); `ExpenseList`; `BalancePanel` (computes `netBalances` from the group's expenses+splits and formats); `SettleUpPanel` (runs `simplifyDebts` → "A pays B $X" list, empty state when settled).
- Wire all into `groups/[id]/page.tsx`. Build/tsc/eslint clean; tests still green. Commit `feat: members, expenses, balances and settle-up`.

### Task 7: README/CI/repo/deploy
- `.github/workflows/ci.yml` (copy dropfour's). `LICENSE` MIT (copy dropfour's). OG metadata in layout (`metadataBase` https://splitwisely.vercel.app, openGraph).
- README (NO em dashes; real fences): CI badge; what it is; Features table; "How it works" (debt-simplification greedy min-cash-flow with the n−1 bound; Supabase RLS creator-owns model; integer-cents money); Decisions (3: Supabase+RLS over local; debt simplification over net-only; integer cents over floats); Schema + Setup (create Supabase project, run supabase/schema.sql, enable Email auth, set the 2 NEXT_PUBLIC env vars locally + Vercel); Run locally; Stack; MIT.
- Gate green → commit `docs: README with algorithm + RLS writeup; ci: test + build workflow` → verify no Co-Authored/Claude → `gh repo create KP-MobileTechie/splitwisely --public --source D:\Projects\splitwisely --push` → `gh repo edit ... --description "Group expense splitter with Supabase auth + RLS and a debt-simplification settle-up algorithm. Next.js + TypeScript." --homepage <prod-url>`.
- Deploy: `vercel --cwd ... --yes` then `--prod --yes`. App builds + serves without env (login shows setup notice); owner adds Supabase env + runs schema later. If prod URL differs from splitwisely.vercel.app, update README + metadataBase + homepage, commit "docs: point live-demo link at production URL", push. Confirm 200 + CI green.

## Verification checklist
- ~22 lib tests green; build/tsc/eslint clean; CI green
- Algorithm: simplifyDebts correct on all tested cases, deterministic
- Unconfigured (no Supabase env) build + login setup-notice work; no crash paths
- ALL commits krunal85 <kp587372@gmail.com> (verify %ae), zero AI attribution
- Live URL serving; README accurate, no em dashes

## Post-ship (owner): create Supabase project + run schema.sql + enable Email auth + set env vars (local + Vercel) + redeploy; record demo GIF; verify kp587372@gmail.com on GitHub for graph credit.
