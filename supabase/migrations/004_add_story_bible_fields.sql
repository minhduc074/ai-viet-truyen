-- =============================================
-- Add persistent story bible fields
-- Run this in Supabase SQL Editor
-- =============================================

ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS world_setting text,
ADD COLUMN IF NOT EXISTS cultivation_system text,
ADD COLUMN IF NOT EXISTS ending_goal text,
ADD COLUMN IF NOT EXISTS companion_name text,
ADD COLUMN IF NOT EXISTS companion_role text,
ADD COLUMN IF NOT EXISTS companion_description text,
ADD COLUMN IF NOT EXISTS companion_goal text,
ADD COLUMN IF NOT EXISTS companion_arc text,
ADD COLUMN IF NOT EXISTS current_power_level text;

COMMENT ON COLUMN public.stories.world_setting IS 'Canonical world setting used across all chapters';
COMMENT ON COLUMN public.stories.cultivation_system IS 'Canonical realm and power progression for the story';
COMMENT ON COLUMN public.stories.ending_goal IS 'Major ending target that determines when the story can conclude';
COMMENT ON COLUMN public.stories.companion_name IS 'Primary companion name';
COMMENT ON COLUMN public.stories.companion_role IS 'Primary companion role in the story';
COMMENT ON COLUMN public.stories.companion_description IS 'Primary companion appearance, personality and thinking style';
COMMENT ON COLUMN public.stories.companion_goal IS 'Primary companion personal objective';
COMMENT ON COLUMN public.stories.companion_arc IS 'How long the companion stays with the protagonist';
COMMENT ON COLUMN public.stories.current_power_level IS 'Latest known protagonist power level returned by AI';