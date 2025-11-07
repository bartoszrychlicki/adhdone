-- migration: 20251120103000_allow_child_point_transactions.sql
-- purpose: permit child profiles to insert their own point transactions (routine completion, reward redemption) while keeping parent/admin restrictions intact.

begin;

drop policy if exists point_transactions_insert_authenticated on public.point_transactions;

create policy point_transactions_insert_authenticated on public.point_transactions
  for insert to authenticated
  with check (
    (public.is_parent() and public.can_access_family(family_id))
    or public.is_admin()
    or (
      public.is_child()
      and profile_id = public.current_profile_id()
      and public.can_access_family(family_id)
    )
  );

commit;
