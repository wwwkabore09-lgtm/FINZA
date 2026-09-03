-- One budget per category per household, so it can be upserted from the UI
-- instead of accumulating duplicate rows every time it's edited.

delete from budgets a using budgets b
  where a.household_id = b.household_id
    and a.category_id = b.category_id
    and a.created_at < b.created_at;

alter table budgets
  add constraint budgets_household_category_unique unique (household_id, category_id);
