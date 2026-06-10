export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Member {
  id: string;
  group_id: string;
  user_id: string | null;
  display_name: string;
  created_at: string;
}

export type SplitKind = "equal" | "exact";

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount_cents: number;
  paid_by: string;
  split_kind: SplitKind;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  amount_cents: number;
}
