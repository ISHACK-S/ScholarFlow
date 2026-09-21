create extension if not exists "uuid-ossp";

create table if not exists public.notes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    title text,
    file_name text,
    file_url text,
    raw_text text,
    summary text,
    key_points text,
    definitions text,
    formulas text,
    quiz jsonb default '[]'::jsonb,
    video_script text,
    created_at timestamptz not null default now()
);

create table if not exists public.quiz_scores (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    note_id uuid not null references public.notes(id) on delete cascade,
    score integer not null default 0,
    correct_answers integer not null default 0,
    wrong_answers integer not null default 0,
    total_questions integer not null default 0,
    percentage integer not null default 0,
    time_taken integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.learning_analytics (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    note_id uuid,
    quiz_score integer not null default 0,
    correct_answers integer not null default 0,
    wrong_answers integer not null default 0,
    percentage integer not null default 0,
    study_time_minutes integer not null default 0,
    quiz_attempts integer not null default 0,
    notes_opened integer not null default 0,
    notes_completed integer not null default 0,
    video_script_opened integer not null default 0,
    quiz_started integer not null default 0,
    quiz_completed integer not null default 0,
    completion_percentage integer not null default 0,
    topics_completed integer not null default 0,
    last_activity timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.notes enable row level security;
alter table public.quiz_scores enable row level security;
alter table public.learning_analytics enable row level security;

create policy "Users can view their own notes" on public.notes
for select using (auth.uid() = user_id);

create policy "Users can insert their own notes" on public.notes
for insert with check (auth.uid() = user_id);

create policy "Users can update their own notes" on public.notes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own notes" on public.notes
for delete using (auth.uid() = user_id);

create policy "Users can view their own quiz scores" on public.quiz_scores
for select using (auth.uid() = user_id);

create policy "Users can insert their own quiz scores" on public.quiz_scores
for insert with check (auth.uid() = user_id);

create policy "Users can view their own analytics" on public.learning_analytics
for select using (auth.uid() = user_id);

create policy "Users can insert their own analytics" on public.learning_analytics
for insert with check (auth.uid() = user_id);

create policy "Users can update their own analytics" on public.learning_analytics
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
