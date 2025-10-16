-- migration: 20251015140213_init_core_schema.sql
-- purpose: establish the core routine-tracking domain schema, enumerations, constraints, indexes, helper functions, and row level security required by the application.
-- affected: types profile_role, routine_type, routine_session_status, point_transaction_type, reward_redemption_status; tables families, profiles, child_access_tokens, routines, child_routines, routine_tasks, routine_sessions, task_completions, routine_performance_stats, point_transactions, rewards, reward_child_visibility, reward_redemptions, achievements, user_achievements, family_points_snapshots; helper functions for rls evaluation; comprehensive rls policies for anon and authenticated roles.
-- notes: all statements use lowercase sql, leverage soft deletes, and align with supabase best practices. rls is enabled immediately after table creation and granular policies are defined per table/action/role.

begin;

-- ensure required extensions exist for uuid generation and case-insensitive text handling.
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- define enumerated types used by multiple tables to keep state domains explicit.
create type profile_role as enum ('parent', 'child', 'admin');
create type routine_type as enum ('morning', 'afternoon', 'evening', 'custom');
create type routine_session_status as enum ('scheduled', 'in_progress', 'completed', 'auto_closed', 'skipped', 'expired');
create type point_transaction_type as enum ('task_completion', 'routine_bonus', 'manual_adjustment', 'reward_redeem');
create type reward_redemption_status as enum ('pending', 'approved', 'fulfilled', 'rejected', 'cancelled');

-- root entity describing a family organization unit.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  family_name text not null,
  timezone text not null default 'Europe/Warsaw',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.families enable row level security;

-- unified profile store for parents, children, and admin actors.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  role profile_role not null,
  display_name text not null,
  email citext,
  avatar_url text,
  last_login_at timestamptz,
  pin_hash text,
  pin_failed_attempts integer not null default 0 check (pin_failed_attempts >= 0),
  pin_lock_expires_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_parent_requires_auth check (role <> 'parent' or auth_user_id is not null)
);
alter table public.profiles enable row level security;

-- url token store backing child authentication flows.
create table public.child_access_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  deactivated_at timestamptz,
  deactivated_by_profile_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);
alter table public.child_access_tokens enable row level security;

-- family-level routine templates describing windows and shared metadata.
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  slug text not null,
  routine_type routine_type not null default 'custom',
  start_time time,
  end_time time,
  auto_close_after_minutes integer check (auto_close_after_minutes is null or auto_close_after_minutes > 0),
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (family_id, slug)
);
alter table public.routines enable row level security;

-- join table permitting per-child activation of routines.
create table public.child_routines (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  child_profile_id uuid not null references public.profiles(id) on delete cascade,
  position smallint not null default 1 check (position > 0),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (routine_id, child_profile_id)
);
alter table public.child_routines enable row level security;

-- concrete task copies per child per routine.
create table public.routine_tasks (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  child_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  points integer not null default 0 check (points >= 0),
  position smallint not null check (position > 0),
  is_optional boolean not null default false,
  is_active boolean not null default true,
  expected_duration_seconds integer check (expected_duration_seconds is null or expected_duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (child_profile_id, routine_id, position)
);
alter table public.routine_tasks enable row level security;

-- session log capturing execution lifecycle per child per day.
create table public.routine_sessions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  child_profile_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  status routine_session_status not null default 'scheduled',
  started_at timestamptz,
  completed_at timestamptz,
  planned_end_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  bonus_multiplier numeric(4,2) not null default 1.00 check (bonus_multiplier >= 1),
  best_time_beaten boolean not null default false,
  completion_reason text,
  auto_closed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_profile_id, routine_id, session_date)
);
alter table public.routine_sessions enable row level security;

-- task-level completion log tied to sessions.
create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  routine_session_id uuid not null references public.routine_sessions(id) on delete cascade,
  routine_task_id uuid references public.routine_tasks(id) on delete set null,
  position smallint not null check (position > 0),
  completed_at timestamptz not null default now(),
  points_awarded integer not null check (points_awarded >= 0),
  was_bonus boolean not null default false,
  duration_since_session_start_seconds integer check (duration_since_session_start_seconds is null or duration_since_session_start_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb,
  unique (routine_session_id, routine_task_id),
  unique (routine_session_id, position)
);
alter table public.task_completions enable row level security;

-- denormalized stats supporting dashboards and timers.
create table public.routine_performance_stats (
  child_profile_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  best_duration_seconds integer check (best_duration_seconds is null or best_duration_seconds > 0),
  best_session_id uuid references public.routine_sessions(id) on delete set null,
  streak_days integer not null default 0 check (streak_days >= 0),
  last_completed_session_id uuid references public.routine_sessions(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (child_profile_id, routine_id)
);
alter table public.routine_performance_stats enable row level security;

-- immutable ledger of point movements per profile.
create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  transaction_type point_transaction_type not null,
  points_delta integer not null check (points_delta <> 0),
  balance_after integer not null,
  reference_id uuid,
  reference_table text,
  metadata jsonb not null default '{}'::jsonb,
  reason text,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.point_transactions enable row level security;

-- catalog of rewards maintained by parents.
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  description text,
  cost_points integer not null check (cost_points > 0),
  is_repeatable boolean not null default true,
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.rewards enable row level security;

-- per-child reward visibility controls.
create table public.reward_child_visibility (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete cascade,
  child_profile_id uuid not null references public.profiles(id) on delete cascade,
  is_visible boolean not null default true,
  visible_from timestamptz,
  visible_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (reward_id, child_profile_id)
);
alter table public.reward_child_visibility enable row level security;

-- redemption workflow representing child reward claims.
create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete cascade,
  child_profile_id uuid not null references public.profiles(id) on delete cascade,
  status reward_redemption_status not null default 'pending',
  points_cost integer not null check (points_cost > 0),
  point_transaction_id uuid references public.point_transactions(id) on delete set null,
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by_profile_id uuid references public.profiles(id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by_profile_id uuid references public.profiles(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reward_redemptions enable row level security;

-- achievement catalog (global or family scoped).
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  criteria jsonb not null,
  icon_url text,
  is_active boolean not null default true,
  family_id uuid references public.families(id) on delete cascade,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.achievements enable row level security;

-- link table recording awarded achievements per profile.
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by_profile_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  unique (profile_id, achievement_id)
);
alter table public.user_achievements enable row level security;

-- snapshot table to accelerate dashboard analytics.
create table public.family_points_snapshots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  snapshot_date date not null,
  points_balance integer not null,
  earned_points integer not null default 0,
  spent_points integer not null default 0,
  created_at timestamptz not null default now(),
  unique (profile_id, snapshot_date)
);
alter table public.family_points_snapshots enable row level security;

-- indexes to match dominant access paths defined in db plan.
create index profiles_family_role_idx on public.profiles (family_id, role);
create unique index child_access_tokens_active_idx on public.child_access_tokens (profile_id) where deactivated_at is null;
create index routines_family_active_idx on public.routines (family_id) include (is_active);
create index routine_tasks_child_order_idx on public.routine_tasks (child_profile_id, routine_id, position);
create index routine_sessions_child_date_idx on public.routine_sessions (child_profile_id, session_date desc);
create index routine_sessions_status_idx on public.routine_sessions (status);
create index task_completions_session_order_idx on public.task_completions (routine_session_id, position);
create index point_transactions_profile_created_idx on public.point_transactions (profile_id, created_at desc);
create index point_transactions_family_type_idx on public.point_transactions (family_id, transaction_type);
create index rewards_family_active_idx on public.rewards (family_id) where deleted_at is null;
create index reward_child_visibility_window_idx on public.reward_child_visibility (child_profile_id, visible_from, visible_until);
create index reward_redemptions_child_status_idx on public.reward_redemptions (child_profile_id, status);
create index user_achievements_profile_idx on public.user_achievements (profile_id);
create index routine_performance_stats_child_idx on public.routine_performance_stats (child_profile_id);
create index family_points_snapshots_profile_date_idx on public.family_points_snapshots (profile_id, snapshot_date desc);

-- helper functions centralizing policy predicates to avoid duplication and keep policies readable.
create or replace function public.current_profile_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_profile uuid;
begin
  begin
    claimed_profile := current_setting('request.jwt.claims.profile_id', true)::uuid;
  exception
    when others then
      claimed_profile := null;
  end;
  if claimed_profile is not null then
    return claimed_profile;
  end if;

  if auth.uid() is not null then
    select p.id
    into claimed_profile
    from public.profiles p
    where p.auth_user_id = auth.uid()
    order by p.created_at
    limit 1;
  end if;
  return claimed_profile;
end;
$$;

create or replace function public.current_family_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select p.family_id
  from public.profiles p
  where p.id = public.current_profile_id()
  limit 1;
$$;

create or replace function public.current_profile_role()
returns profile_role
language sql
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = public.current_profile_id()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when current_setting('request.jwt.claims.role', true) = 'service_role' then true
      else coalesce(public.current_profile_role() = 'admin', false)
    end;
$$;

create or replace function public.is_parent()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'parent', false);
$$;

create or replace function public.is_child()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'child', false);
$$;

create or replace function public.can_access_family(target_family_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when public.is_admin() then true
      when target_family_id is null then false
      else target_family_id = public.current_family_id()
    end;
$$;

create or replace function public.can_access_profile(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when public.is_admin() then true
      when target_profile_id is null then false
      when public.is_child() then target_profile_id = public.current_profile_id()
      when public.is_parent() then
        exists (
          select 1
          from public.profiles p
          where p.id = target_profile_id
            and p.family_id = public.current_family_id()
        )
      else false
    end;
$$;

-- granular row level security policies defined per role and action.
-- anon role is denied everywhere to prevent unauthenticated access.

-- families policies.
create policy families_select_anon on public.families for select to anon using (false);
create policy families_insert_anon on public.families for insert to anon with check (false);
create policy families_update_anon on public.families for update to anon using (false) with check (false);
create policy families_delete_anon on public.families for delete to anon using (false);

create policy families_select_authenticated on public.families
  for select to authenticated
  using (public.can_access_family(id));
create policy families_insert_authenticated on public.families
  for insert to authenticated
  with check (public.is_admin());
create policy families_update_authenticated on public.families
  for update to authenticated
  using (public.can_access_family(id))
  with check (public.can_access_family(id));
create policy families_delete_authenticated on public.families
  for delete to authenticated
  using (public.is_admin());

-- profiles policies.
create policy profiles_select_anon on public.profiles for select to anon using (false);
create policy profiles_insert_anon on public.profiles for insert to anon with check (false);
create policy profiles_update_anon on public.profiles for update to anon using (false) with check (false);
create policy profiles_delete_anon on public.profiles for delete to anon using (false);

create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (public.is_admin() or public.is_parent() and family_id = public.current_family_id() or id = public.current_profile_id());
create policy profiles_insert_authenticated on public.profiles
  for insert to authenticated
  with check ((public.is_admin()) or (public.is_parent() and family_id = public.current_family_id()));
create policy profiles_update_authenticated on public.profiles
  for update to authenticated
  using (public.can_access_profile(id))
  with check (public.can_access_profile(id));
create policy profiles_delete_authenticated on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- child_access_tokens policies.
create policy child_access_tokens_select_anon on public.child_access_tokens for select to anon using (false);
create policy child_access_tokens_insert_anon on public.child_access_tokens for insert to anon with check (false);
create policy child_access_tokens_update_anon on public.child_access_tokens for update to anon using (false) with check (false);
create policy child_access_tokens_delete_anon on public.child_access_tokens for delete to anon using (false);

create policy child_access_tokens_select_authenticated on public.child_access_tokens
  for select to authenticated
  using (public.can_access_profile(profile_id));
create policy child_access_tokens_insert_authenticated on public.child_access_tokens
  for insert to authenticated
  with check ((public.is_parent() or public.is_admin()) and public.can_access_profile(profile_id));
create policy child_access_tokens_update_authenticated on public.child_access_tokens
  for update to authenticated
  using (public.can_access_profile(profile_id))
  with check (public.can_access_profile(profile_id));
create policy child_access_tokens_delete_authenticated on public.child_access_tokens
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(profile_id)) or public.is_admin());

-- routines policies.
create policy routines_select_anon on public.routines for select to anon using (false);
create policy routines_insert_anon on public.routines for insert to anon with check (false);
create policy routines_update_anon on public.routines for update to anon using (false) with check (false);
create policy routines_delete_anon on public.routines for delete to anon using (false);

create policy routines_select_authenticated on public.routines
  for select to authenticated
  using (public.can_access_family(family_id));
create policy routines_insert_authenticated on public.routines
  for insert to authenticated
  with check ((public.is_parent() or public.is_admin()) and public.can_access_family(family_id));
create policy routines_update_authenticated on public.routines
  for update to authenticated
  using (((public.is_parent() and public.can_access_family(family_id)) or public.is_admin()))
  with check (((public.is_parent() and public.can_access_family(family_id)) or public.is_admin()));
create policy routines_delete_authenticated on public.routines
  for delete to authenticated
  using ((public.is_parent() and public.can_access_family(family_id)) or public.is_admin());

-- child_routines policies.
create policy child_routines_select_anon on public.child_routines for select to anon using (false);
create policy child_routines_insert_anon on public.child_routines for insert to anon with check (false);
create policy child_routines_update_anon on public.child_routines for update to anon using (false) with check (false);
create policy child_routines_delete_anon on public.child_routines for delete to anon using (false);

create policy child_routines_select_authenticated on public.child_routines
  for select to authenticated
  using (public.can_access_profile(child_profile_id));
create policy child_routines_insert_authenticated on public.child_routines
  for insert to authenticated
  with check ((public.is_parent() or public.is_admin()) and public.can_access_profile(child_profile_id));
create policy child_routines_update_authenticated on public.child_routines
  for update to authenticated
  using (public.can_access_profile(child_profile_id))
  with check (public.can_access_profile(child_profile_id));
create policy child_routines_delete_authenticated on public.child_routines
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin());

-- routine_tasks policies.
create policy routine_tasks_select_anon on public.routine_tasks for select to anon using (false);
create policy routine_tasks_insert_anon on public.routine_tasks for insert to anon with check (false);
create policy routine_tasks_update_anon on public.routine_tasks for update to anon using (false) with check (false);
create policy routine_tasks_delete_anon on public.routine_tasks for delete to anon using (false);

create policy routine_tasks_select_authenticated on public.routine_tasks
  for select to authenticated
  using (public.can_access_profile(child_profile_id));
create policy routine_tasks_insert_authenticated on public.routine_tasks
  for insert to authenticated
  with check ((public.is_parent() or public.is_admin()) and public.can_access_profile(child_profile_id));
create policy routine_tasks_update_authenticated on public.routine_tasks
  for update to authenticated
  using (((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin()))
  with check (((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin()));
create policy routine_tasks_delete_authenticated on public.routine_tasks
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin());

-- routine_sessions policies.
create policy routine_sessions_select_anon on public.routine_sessions for select to anon using (false);
create policy routine_sessions_insert_anon on public.routine_sessions for insert to anon with check (false);
create policy routine_sessions_update_anon on public.routine_sessions for update to anon using (false) with check (false);
create policy routine_sessions_delete_anon on public.routine_sessions for delete to anon using (false);

create policy routine_sessions_select_authenticated on public.routine_sessions
  for select to authenticated
  using (public.can_access_profile(child_profile_id));
create policy routine_sessions_insert_authenticated on public.routine_sessions
  for insert to authenticated
  with check (public.can_access_profile(child_profile_id));
create policy routine_sessions_update_authenticated on public.routine_sessions
  for update to authenticated
  using (public.can_access_profile(child_profile_id))
  with check (public.can_access_profile(child_profile_id));
create policy routine_sessions_delete_authenticated on public.routine_sessions
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin());

-- task_completions policies.
create policy task_completions_select_anon on public.task_completions for select to anon using (false);
create policy task_completions_insert_anon on public.task_completions for insert to anon with check (false);
create policy task_completions_update_anon on public.task_completions for update to anon using (false) with check (false);
create policy task_completions_delete_anon on public.task_completions for delete to anon using (false);

create policy task_completions_select_authenticated on public.task_completions
  for select to authenticated
  using (public.can_access_profile((select rs.child_profile_id from public.routine_sessions rs where rs.id = routine_session_id)));
create policy task_completions_insert_authenticated on public.task_completions
  for insert to authenticated
  with check (public.can_access_profile((select rs.child_profile_id from public.routine_sessions rs where rs.id = routine_session_id)));
create policy task_completions_update_authenticated on public.task_completions
  for update to authenticated
  using (public.can_access_profile((select rs.child_profile_id from public.routine_sessions rs where rs.id = routine_session_id)))
  with check (public.can_access_profile((select rs.child_profile_id from public.routine_sessions rs where rs.id = routine_session_id)));
create policy task_completions_delete_authenticated on public.task_completions
  for delete to authenticated
  using (public.is_parent() and public.can_access_profile((select rs.child_profile_id from public.routine_sessions rs where rs.id = routine_session_id)));

-- routine_performance_stats policies.
create policy routine_performance_stats_select_anon on public.routine_performance_stats for select to anon using (false);
create policy routine_performance_stats_insert_anon on public.routine_performance_stats for insert to anon with check (false);
create policy routine_performance_stats_update_anon on public.routine_performance_stats for update to anon using (false) with check (false);
create policy routine_performance_stats_delete_anon on public.routine_performance_stats for delete to anon using (false);

create policy routine_performance_stats_select_authenticated on public.routine_performance_stats
  for select to authenticated
  using (public.can_access_profile(child_profile_id));
create policy routine_performance_stats_insert_authenticated on public.routine_performance_stats
  for insert to authenticated
  with check ((public.can_access_profile(child_profile_id)) or public.is_admin());
create policy routine_performance_stats_update_authenticated on public.routine_performance_stats
  for update to authenticated
  using ((public.can_access_profile(child_profile_id)) or public.is_admin())
  with check ((public.can_access_profile(child_profile_id)) or public.is_admin());
create policy routine_performance_stats_delete_authenticated on public.routine_performance_stats
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin());

-- point_transactions policies.
create policy point_transactions_select_anon on public.point_transactions for select to anon using (false);
create policy point_transactions_insert_anon on public.point_transactions for insert to anon with check (false);
create policy point_transactions_update_anon on public.point_transactions for update to anon using (false) with check (false);
create policy point_transactions_delete_anon on public.point_transactions for delete to anon using (false);

create policy point_transactions_select_authenticated on public.point_transactions
  for select to authenticated
  using (
    public.is_admin()
    or (public.is_parent() and public.can_access_family(family_id))
    or profile_id = public.current_profile_id()
  );
create policy point_transactions_insert_authenticated on public.point_transactions
  for insert to authenticated
  with check (
    (public.is_parent() and public.can_access_family(family_id))
    or public.is_admin()
  );
create policy point_transactions_update_authenticated on public.point_transactions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy point_transactions_delete_authenticated on public.point_transactions
  for delete to authenticated
  using (public.is_admin());

-- rewards policies.
create policy rewards_select_anon on public.rewards for select to anon using (false);
create policy rewards_insert_anon on public.rewards for insert to anon with check (false);
create policy rewards_update_anon on public.rewards for update to anon using (false) with check (false);
create policy rewards_delete_anon on public.rewards for delete to anon using (false);

create policy rewards_select_authenticated on public.rewards
  for select to authenticated
  using (public.can_access_family(family_id));
create policy rewards_insert_authenticated on public.rewards
  for insert to authenticated
  with check ((public.is_parent() or public.is_admin()) and public.can_access_family(family_id));
create policy rewards_update_authenticated on public.rewards
  for update to authenticated
  using (((public.is_parent() and public.can_access_family(family_id)) or public.is_admin()))
  with check (((public.is_parent() and public.can_access_family(family_id)) or public.is_admin()));
create policy rewards_delete_authenticated on public.rewards
  for delete to authenticated
  using ((public.is_parent() and public.can_access_family(family_id)) or public.is_admin());

-- reward_child_visibility policies.
create policy reward_child_visibility_select_anon on public.reward_child_visibility for select to anon using (false);
create policy reward_child_visibility_insert_anon on public.reward_child_visibility for insert to anon with check (false);
create policy reward_child_visibility_update_anon on public.reward_child_visibility for update to anon using (false) with check (false);
create policy reward_child_visibility_delete_anon on public.reward_child_visibility for delete to anon using (false);

create policy reward_child_visibility_select_authenticated on public.reward_child_visibility
  for select to authenticated
  using (public.can_access_profile(child_profile_id));
create policy reward_child_visibility_insert_authenticated on public.reward_child_visibility
  for insert to authenticated
  with check ((public.is_parent() or public.is_admin()) and public.can_access_profile(child_profile_id));
create policy reward_child_visibility_update_authenticated on public.reward_child_visibility
  for update to authenticated
  using (((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin()))
  with check (((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin()));
create policy reward_child_visibility_delete_authenticated on public.reward_child_visibility
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin());

-- reward_redemptions policies.
create policy reward_redemptions_select_anon on public.reward_redemptions for select to anon using (false);
create policy reward_redemptions_insert_anon on public.reward_redemptions for insert to anon with check (false);
create policy reward_redemptions_update_anon on public.reward_redemptions for update to anon using (false) with check (false);
create policy reward_redemptions_delete_anon on public.reward_redemptions for delete to anon using (false);

create policy reward_redemptions_select_authenticated on public.reward_redemptions
  for select to authenticated
  using (public.can_access_profile(child_profile_id));
create policy reward_redemptions_insert_authenticated on public.reward_redemptions
  for insert to authenticated
  with check (public.can_access_profile(child_profile_id));
create policy reward_redemptions_update_authenticated on public.reward_redemptions
  for update to authenticated
  using (public.can_access_profile(child_profile_id))
  with check (public.can_access_profile(child_profile_id));
create policy reward_redemptions_delete_authenticated on public.reward_redemptions
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(child_profile_id)) or public.is_admin());

-- achievements policies.
create policy achievements_select_anon on public.achievements for select to anon using (false);
create policy achievements_insert_anon on public.achievements for insert to anon with check (false);
create policy achievements_update_anon on public.achievements for update to anon using (false) with check (false);
create policy achievements_delete_anon on public.achievements for delete to anon using (false);

create policy achievements_select_authenticated on public.achievements
  for select to authenticated
  using (public.is_admin() or public.can_access_family(family_id) or family_id is null);
create policy achievements_insert_authenticated on public.achievements
  for insert to authenticated
  with check (public.is_parent() and public.can_access_family(family_id) or public.is_admin());
create policy achievements_update_authenticated on public.achievements
  for update to authenticated
  using (public.is_parent() and public.can_access_family(family_id) or public.is_admin())
  with check (public.is_parent() and public.can_access_family(family_id) or public.is_admin());
create policy achievements_delete_authenticated on public.achievements
  for delete to authenticated
  using (public.is_parent() and public.can_access_family(family_id) or public.is_admin());

-- user_achievements policies.
create policy user_achievements_select_anon on public.user_achievements for select to anon using (false);
create policy user_achievements_insert_anon on public.user_achievements for insert to anon with check (false);
create policy user_achievements_update_anon on public.user_achievements for update to anon using (false) with check (false);
create policy user_achievements_delete_anon on public.user_achievements for delete to anon using (false);

create policy user_achievements_select_authenticated on public.user_achievements
  for select to authenticated
  using (public.can_access_profile(profile_id));
create policy user_achievements_insert_authenticated on public.user_achievements
  for insert to authenticated
  with check (public.can_access_profile(profile_id));
create policy user_achievements_update_authenticated on public.user_achievements
  for update to authenticated
  using (public.can_access_profile(profile_id))
  with check (public.can_access_profile(profile_id));
create policy user_achievements_delete_authenticated on public.user_achievements
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(profile_id)) or public.is_admin());

-- family_points_snapshots policies.
create policy family_points_snapshots_select_anon on public.family_points_snapshots for select to anon using (false);
create policy family_points_snapshots_insert_anon on public.family_points_snapshots for insert to anon with check (false);
create policy family_points_snapshots_update_anon on public.family_points_snapshots for update to anon using (false) with check (false);
create policy family_points_snapshots_delete_anon on public.family_points_snapshots for delete to anon using (false);

create policy family_points_snapshots_select_authenticated on public.family_points_snapshots
  for select to authenticated
  using (public.can_access_profile(profile_id));
create policy family_points_snapshots_insert_authenticated on public.family_points_snapshots
  for insert to authenticated
  with check (((public.is_parent() and public.can_access_profile(profile_id)) or public.is_admin()));
create policy family_points_snapshots_update_authenticated on public.family_points_snapshots
  for update to authenticated
  using ((public.can_access_profile(profile_id)) or public.is_admin())
  with check ((public.can_access_profile(profile_id)) or public.is_admin());
create policy family_points_snapshots_delete_authenticated on public.family_points_snapshots
  for delete to authenticated
  using ((public.is_parent() and public.can_access_profile(profile_id)) or public.is_admin());

commit;
-- enforce uniqueness on active reward names per family while permitting soft deletes.
create unique index rewards_family_name_active_uidx on public.rewards (family_id, name) where deleted_at is null;
