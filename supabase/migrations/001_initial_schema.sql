-- =============================================
-- AI Viết Truyện - Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  chapters_played int default 0,
  stories_completed int default 0,
  created_at timestamptz default now()
);

-- Guest Sessions
create table if not exists public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text unique not null,
  chapters_used int default 0,
  created_at timestamptz default now()
);

-- Stories
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  guest_session_id uuid references public.guest_sessions(id) on delete set null,
  title text not null,
  genre text not null,
  premise text,
  character_name text,
  character_description text,
  tone text default 'balanced' check (tone in ('humorous','serious','dark','wholesome','balanced')),
  chapter_length text default 'medium' check (chapter_length in ('short','medium','long')),
  status text default 'active' check (status in ('active','completed','abandoned')),
  is_public boolean default false,
  chapter_count int default 0,
  likes_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chapters
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade not null,
  chapter_number int not null,
  chapter_title text,
  content text not null,
  summary text,
  parent_chapter_id uuid references public.chapters(id) on delete set null,
  choice_made text,
  created_at timestamptz default now()
);

-- Choices
create table if not exists public.choices (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  choice_text text not null,
  choice_order int not null,
  is_selected boolean default false
);

-- Story Likes
create table if not exists public.story_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, story_id)
);

-- User Achievements
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_key)
);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_stories_user_id on public.stories(user_id);
create index if not exists idx_stories_guest_session_id on public.stories(guest_session_id);
create index if not exists idx_stories_is_public on public.stories(is_public);
create index if not exists idx_stories_genre on public.stories(genre);
create index if not exists idx_chapters_story_id on public.chapters(story_id);
create index if not exists idx_chapters_chapter_number on public.chapters(chapter_number);
create index if not exists idx_choices_chapter_id on public.choices(chapter_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to increment guest chapter count
create or replace function public.increment_guest_chapters(session_id uuid)
returns void as $$
begin
  update public.guest_sessions
  set chapters_used = chapters_used + 1
  where id = session_id;
end;
$$ language plpgsql security definer;

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.choices enable row level security;
alter table public.guest_sessions enable row level security;
alter table public.story_likes enable row level security;
alter table public.user_achievements enable row level security;

-- Profiles policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Stories policies
create policy "Anyone can view public stories" on public.stories
  for select using (is_public = true);

create policy "Users can view their own stories" on public.stories
  for select using (auth.uid() = user_id);

create policy "Users can create stories" on public.stories
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own stories" on public.stories
  for update using (auth.uid() = user_id);

create policy "Users can delete their own stories" on public.stories
  for delete using (auth.uid() = user_id);

-- Chapters policies
create policy "Anyone can view chapters of accessible stories" on public.chapters
  for select using (
    exists (
      select 1 from public.stories s
      where s.id = story_id
      and (s.is_public = true or s.user_id = auth.uid())
    )
  );

create policy "Can insert chapters to own stories" on public.chapters
  for insert with check (
    exists (
      select 1 from public.stories s
      where s.id = story_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

-- Choices policies
create policy "Anyone can view choices of accessible chapters" on public.choices
  for select using (
    exists (
      select 1 from public.chapters c
      join public.stories s on s.id = c.story_id
      where c.id = chapter_id
      and (s.is_public = true or s.user_id = auth.uid())
    )
  );

create policy "Can insert choices to own story chapters" on public.choices
  for insert with check (
    exists (
      select 1 from public.chapters c
      join public.stories s on s.id = c.story_id
      where c.id = chapter_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "Can update choices on own story chapters" on public.choices
  for update using (
    exists (
      select 1 from public.chapters c
      join public.stories s on s.id = c.story_id
      where c.id = chapter_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

-- Guest sessions policies
create policy "Anyone can create guest sessions" on public.guest_sessions
  for insert with check (true);

create policy "Anyone can view guest sessions" on public.guest_sessions
  for select using (true);

create policy "Anyone can update guest sessions" on public.guest_sessions
  for update using (true);

-- Story likes policies
create policy "Users can view all likes" on public.story_likes
  for select using (true);

create policy "Users can like stories" on public.story_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike stories" on public.story_likes
  for delete using (auth.uid() = user_id);

-- Achievements policies
create policy "Users can view their achievements" on public.user_achievements
  for select using (auth.uid() = user_id);

create policy "System can insert achievements" on public.user_achievements
  for insert with check (auth.uid() = user_id);
