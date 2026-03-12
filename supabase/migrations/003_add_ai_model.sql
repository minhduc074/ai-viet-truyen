-- =============================================
-- Add AI Model Selection to Stories
-- Run this in Supabase SQL Editor
-- =============================================

-- Add ai_model column to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS ai_model text;

-- Add comment for documentation
COMMENT ON COLUMN public.stories.ai_model IS 'OpenRouter model ID used for generating chapters';
