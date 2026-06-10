# splitwisely

[![CI](https://github.com/KP-MobileTechie/splitwisely/actions/workflows/ci.yml/badge.svg)](https://github.com/KP-MobileTechie/splitwisely/actions/workflows/ci.yml)

Split group expenses and settle up with the fewest payments. Create a group, add members, log who paid for what (split equally or by exact amounts), see everyone's net balance, and get a debt-simplification plan that clears every balance in the minimum number of transfers.

Built on a real backend: Supabase Postgres with email magic-link auth and Row-Level Security, so each user only ever sees their own groups.

> Live demo: https://splitwisely.vercel.app

## Features

| Feature | Detail |
|---|---|
| Groups and members | Create groups, add members by name. |
| Expenses | Description, amount, who paid, split equal or exact. |
| Equal split | Remainder cents distributed deterministically (first members get the extra cent). |
| Exact split | Must sum to the total or the form rejects it. |
| Balances | Each member's net: owed or owing. |
| Settle up | Minimum set of "A pays B $X" transfers via debt simplification. |
| Auth | Email magic link, cookie sessions, route guard. |
| Security | Row-Level Security: a user sees only the groups they created. |

## How it works

### Debt simplification (the centerpiece)

After every expense, each member has a net balance: total they paid minus total they owe from splits. These balances always sum to zero. A naive settle-up would have every debtor pay every creditor; that is a lot of payments.

`simplifyDebts` runs a greedy minimum-cash-flow pass: repeatedly match the largest creditor with the largest debtor, settle the smaller of the two amounts, and continue. This produces at most `n - 1` transfers for `n` people. Ordering is stabilised by member id so the output is fully deterministic, which makes it straightforward to unit test (already-settled, two-party, multi-party cycles, uneven remainders, determinism).

The whole algorithm is pure and lives in `lib/settle.ts`, with `lib/split.ts` (equal and exact splits) and `lib/money.ts` (integer-cents parsing and formatting). Money is integer cents everywhere: no floating-point arithmetic ever touches a balance.

### Row-Level Security

Every table (`groups`, `group_members`, `expenses`, `expense_splits`) has RLS enabled. The v1 model is creator-owns-group: `groups.created_by = auth.uid()`, and child rows are authorised by joining back up to their owning group. The database itself enforces isolation, so even a bug in the app cannot leak another user's data: a cross-user query simply returns nothing.

## Decisions

1. **Supabase Postgres + RLS over local storage.** This project is the portfolio's full-stack and security proof, so persistence and access control are real, enforced in the database.
2. **Debt simplification over net-only balances.** Showing net balances is easy; computing the minimum set of payments to settle them is the algorithmic centerpiece, and it is what makes the app actually useful.
3. **Integer cents over floats.** All money is stored and computed as integer cents to avoid rounding drift, with deterministic remainder distribution on equal splits.

## Schema and setup (one-time, owner)

1. Create a free Supabase project.
2. Open the SQL editor, paste `supabase/schema.sql`, and run it. This creates the four tables, enables RLS, and installs the access policies.
3. In Authentication > Providers, enable the Email provider (magic link).
4. Set the two public env vars locally and in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Both keys are public-safe; RLS is what enforces access. The app builds and serves without them: the login page shows a setup notice instead of crashing.

## Run locally

```bash
npm install
npm test          # ~18 pure unit tests (money, split, settle)
npm run dev       # http://localhost:3000
npm run build
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · @supabase/supabase-js · @supabase/ssr · Vitest

## License

MIT. See [LICENSE](LICENSE).
