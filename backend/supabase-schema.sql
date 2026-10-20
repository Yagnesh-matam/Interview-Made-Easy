-- ============================================================================
-- Interview Made Easy — core persistence schema (run in Supabase SQL Editor)
-- ============================================================================
-- Creates the tables the frontend reads/writes for durable, cross-device
-- progress. Every table has Row Level Security enabled with per-user policies:
-- a signed-in user can only ever read or write their OWN rows.
--
-- The app also stores aggregate counters (quizzes_taken, interviews_done,
-- questions_answered, correct_answers, fullName, targetRole, targetCompany,
-- experienceLevel) in auth.users.user_metadata via supabase.auth.updateUser —
-- no extra table is needed for those.

-- ---------------------------------------------------------------------------
-- Quiz sessions: one row per completed 10-question adaptive quiz
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_sessions (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    topic           text not null,
    total_questions int not null default 10,
    correct_answers int not null default 0,
    score           int not null default 0,
    created_at      timestamptz not null default now()
);

alter table public.quiz_sessions enable row level security;

drop policy if exists "Users can view own quiz sessions" on public.quiz_sessions;
create policy "Users can view own quiz sessions"
    on public.quiz_sessions for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own quiz sessions" on public.quiz_sessions;
create policy "Users can insert own quiz sessions"
    on public.quiz_sessions for insert
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Interview sessions: one row per concluded Vocal Arena interview (incl. report)
-- ---------------------------------------------------------------------------
create table if not exists public.interview_sessions (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    mode       text not null default 'concept',     -- 'company' | 'concept' | 'resume'
    company    text,                                -- set in company mode
    topic      text,                                -- concept topic or resume label
    turns      int not null default 0,              -- candidate responses count
    report     text,                                -- AI-generated feedback report
    created_at timestamptz not null default now()
);

alter table public.interview_sessions enable row level security;

drop policy if exists "Users can view own interview sessions" on public.interview_sessions;
create policy "Users can view own interview sessions"
    on public.interview_sessions for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own interview sessions" on public.interview_sessions;
create policy "Users can insert own interview sessions"
    on public.interview_sessions for insert
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Profiles: optional credits ledger used by the dashboard's credit read.
-- (Payments are NOT wired; credits exist for display/future Premium rollout.)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    credits    int not null default 0,
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id) values (new.id) on conflict do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Speed up the dashboard's "recent activity" queries.
create index if not exists quiz_sessions_user_created_idx
    on public.quiz_sessions (user_id, created_at desc);
create index if not exists interview_sessions_user_created_idx
    on public.interview_sessions (user_id, created_at desc);
