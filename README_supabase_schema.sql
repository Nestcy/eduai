-- Run against your Supabase Postgres instance (SQL editor or migration tool).
--
-- student_id is the Supabase Auth user id (auth.users.id), not an
-- arbitrary app-generated string. The FastAPI backend derives it from the
-- verified JWT (see app/api/auth.py) rather than trusting a client value,
-- and the frontend should query these tables directly using the logged-in
-- user's session, relying on the RLS policies below.

create table if not exists student_profiles (
    student_id uuid primary key references auth.users(id) on delete cascade,
    country text not null,
    curriculum_board text not null,
    grade text not null,
    subjects jsonb default '[]',
    created_at timestamptz default now()
);

create table if not exists topic_progress (
    id bigserial primary key,
    student_id uuid references student_profiles(student_id) on delete cascade,
    topic text not null,
    subject text not null,
    self_reported_score double precision not null,
    confidence_level double precision not null,
    updated_at timestamptz default now()
);
create index if not exists idx_topic_progress_student on topic_progress(student_id, subject);

create table if not exists study_plans (
    id bigserial primary key,
    student_id uuid references student_profiles(student_id) on delete cascade,
    subject text not null,
    plan_json jsonb not null,
    generated_at timestamptz default now()
);

create table if not exists revision_history (
    id bigserial primary key,
    student_id uuid references student_profiles(student_id) on delete cascade,
    topic text not null,
    reviewed_at timestamptz default now(),
    notes text default ''
);

create table if not exists document_metadata (
    id bigserial primary key,
    collection_name text not null,
    source_name text not null,
    source_type text not null check (source_type in ('upload', 'web', 'official_curriculum')),
    num_chunks integer not null,
    ingested_at timestamptz default now()
);
create index if not exists idx_document_metadata_collection on document_metadata(collection_name);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
--
-- The FastAPI backend connects via SUPABASE_DB_URL / service role and
-- bypasses RLS entirely (trusted server). These policies matter for the
-- Lovable frontend, which should read student data directly via the
-- Supabase JS client using the logged-in user's session (anon key + JWT),
-- NOT the service key. Nothing outside `auth.uid()`'s own rows should be
-- readable or writable from the browser.
-- ─────────────────────────────────────────────────────────────────────────

alter table student_profiles enable row level security;
alter table topic_progress enable row level security;
alter table study_plans enable row level security;
alter table revision_history enable row level security;

create policy "Students can view their own profile"
    on student_profiles for select
    using (auth.uid() = student_id);

create policy "Students can update their own profile"
    on student_profiles for update
    using (auth.uid() = student_id);

create policy "Students can insert their own profile"
    on student_profiles for insert
    with check (auth.uid() = student_id);

create policy "Students can view their own progress"
    on topic_progress for select
    using (auth.uid() = student_id);

create policy "Students can view their own study plans"
    on study_plans for select
    using (auth.uid() = student_id);

create policy "Students can view their own revision history"
    on revision_history for select
    using (auth.uid() = student_id);

-- document_metadata has no student_id (it's collection-scoped, not
-- student-scoped) — left without RLS; access it only through the backend.
