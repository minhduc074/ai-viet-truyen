-- =============================================
-- Guest RLS patch for existing deployments
-- Run this after 001_initial_schema.sql if app already deployed
-- =============================================

-- Stories: allow guest-created stories (user_id is null) to be readable/updatable.
drop policy if exists "Guests can view guest stories" on public.stories;
create policy "Guests can view guest stories" on public.stories
  for select using (user_id is null);

drop policy if exists "Guests can update guest stories" on public.stories;
create policy "Guests can update guest stories" on public.stories
  for update using (user_id is null);

-- Chapters: allow reading chapters belonging to guest stories.
do $do$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chapters'
      and policyname = 'Anyone can view chapters of accessible stories'
  ) then
    execute $sql$
      alter policy "Anyone can view chapters of accessible stories" on public.chapters
      using (
        exists (
          select 1 from public.stories s
          where s.id = story_id
          and (s.is_public = true or s.user_id = auth.uid() or s.user_id is null)
        )
      )
    $sql$;
  else
    execute $sql$
      create policy "Anyone can view chapters of accessible stories" on public.chapters
      for select using (
        exists (
          select 1 from public.stories s
          where s.id = story_id
          and (s.is_public = true or s.user_id = auth.uid() or s.user_id is null)
        )
      )
    $sql$;
  end if;
end $do$;

-- Choices: allow reading choices belonging to guest stories.
do $do$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'choices'
      and policyname = 'Anyone can view choices of accessible chapters'
  ) then
    execute $sql$
      alter policy "Anyone can view choices of accessible chapters" on public.choices
      using (
        exists (
          select 1 from public.chapters c
          join public.stories s on s.id = c.story_id
          where c.id = chapter_id
          and (s.is_public = true or s.user_id = auth.uid() or s.user_id is null)
        )
      )
    $sql$;
  else
    execute $sql$
      create policy "Anyone can view choices of accessible chapters" on public.choices
      for select using (
        exists (
          select 1 from public.chapters c
          join public.stories s on s.id = c.story_id
          where c.id = chapter_id
          and (s.is_public = true or s.user_id = auth.uid() or s.user_id is null)
        )
      )
    $sql$;
  end if;
end $do$;
