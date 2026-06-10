"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { splitEqual, validateExact } from "@/lib/split";
import type { SplitKind } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function createGroup(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Group name is required." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("groups")
    .insert({ name: trimmed, created_by: user.id });
  if (error) return { error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function addMember(groupId: string, displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) return { error: "Member name is required." };
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, display_name: trimmed });
  if (error) return { error: error.message };
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export interface AddExpenseInput {
  description: string;
  amountCents: number;
  paidBy: string;
  splitKind: SplitKind;
  memberIds: string[];
  exactAmounts?: number[];
}

export async function addExpense(groupId: string, input: AddExpenseInput) {
  const { description, amountCents, paidBy, splitKind, memberIds } = input;
  if (!description.trim()) return { error: "Description is required." };
  if (!Number.isInteger(amountCents) || amountCents <= 0)
    return { error: "Enter a valid amount." };
  if (!paidBy) return { error: "Choose who paid." };
  if (memberIds.length === 0)
    return { error: "Select at least one member to split between." };

  let amounts: number[];
  if (splitKind === "equal") {
    amounts = splitEqual(amountCents, memberIds.length);
  } else {
    amounts = input.exactAmounts ?? [];
    const validation = validateExact(amountCents, amounts);
    if (!validation.ok) return { error: validation.error };
  }

  const { supabase, user } = await requireUser();

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: groupId,
      description: description.trim(),
      amount_cents: amountCents,
      paid_by: paidBy,
      split_kind: splitKind,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (expenseError || !expense) return { error: expenseError?.message ?? "Failed to add expense." };

  const splitRows = memberIds.map((memberId, i) => ({
    expense_id: expense.id,
    member_id: memberId,
    amount_cents: amounts[i],
  }));
  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert(splitRows);
  if (splitError) return { error: splitError.message };

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}
