-- Phase 7 Computer Science skill-gap, roadmap, and career schema

-- Master skill taxonomy (per subject)
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  name text not null,
  description text,
  prerequisite_skill_id uuid references public.skills(id),
  weight numeric default 1.0,
  created_at timestamptz default now()
);

-- Computed proficiency per user per skill
create table if not exists public.skill_profile (
  user_id uuid references auth.users(id) not null,
  skill_id uuid references public.skills(id) not null,
  score numeric not null check (score between 0 and 100),
  last_updated timestamptz default now(),
  primary key (user_id, skill_id)
);

-- Persisted, ordered roadmap
create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  skill_id uuid references public.skills(id) not null,
  order_index int not null,
  target_score numeric not null,
  estimated_minutes int,
  status text default 'pending' check (status in ('pending','in_progress','done')),
  generated_at timestamptz default now()
);

-- Career catalog
create table if not exists public.career_paths (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  description text
);

-- Many-to-many: career requirements
create table if not exists public.career_path_skills (
  career_path_id uuid references public.career_paths(id) not null,
  skill_id uuid references public.skills(id) not null,
  required_score numeric not null check (required_score between 0 and 100),
  primary key (career_path_id, skill_id)
);

-- Quiz attempts use inline question data, so each attempt can be tied to a skill.
alter table public.quiz_scores
  add column if not exists skill_id uuid references public.skills(id);

-- Indexes used by Phase 7 queries
create index if not exists skill_profile_user_id_idx
  on public.skill_profile (user_id);

create index if not exists roadmap_items_user_order_idx
  on public.roadmap_items (user_id, order_index);

create index if not exists career_path_skills_career_idx
  on public.career_path_skills (career_path_id);

-- User-owned data protections
alter table public.skill_profile enable row level security;
alter table public.roadmap_items enable row level security;

create policy "Users can view their own skill profile"
  on public.skill_profile
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own skill profile"
  on public.skill_profile
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own skill profile"
  on public.skill_profile
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their own roadmap items"
  on public.roadmap_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own roadmap items"
  on public.roadmap_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own roadmap items"
  on public.roadmap_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own roadmap items"
  on public.roadmap_items
  for delete
  using (auth.uid() = user_id);

-- Catalog data is readable by authenticated users.
alter table public.skills enable row level security;
alter table public.career_paths enable row level security;
alter table public.career_path_skills enable row level security;

create policy "Authenticated users can view skills"
  on public.skills
  for select
  to authenticated
  using (true);

create policy "Authenticated users can view career paths"
  on public.career_paths
  for select
  to authenticated
  using (true);

create policy "Authenticated users can view career path skills"
  on public.career_path_skills
  for select
  to authenticated
  using (true);
