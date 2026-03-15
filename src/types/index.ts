// ===== Genre =====
export interface Genre {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// ===== Story =====
export type StoryStatus = "active" | "completed" | "abandoned";
export type ChapterLength = "short" | "medium" | "long";
export type StoryTone = "humorous" | "serious" | "dark" | "wholesome" | "balanced";

export interface Story {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  title: string;
  genre: string;
  premise: string | null;
  world_setting: string | null;
  cultivation_system: string | null;
  ending_goal: string | null;
  character_name: string | null;
  character_description: string | null;
  companion_name: string | null;
  companion_role: string | null;
  companion_description: string | null;
  companion_goal: string | null;
  companion_arc: string | null;
  current_power_level: string | null;
  tone: StoryTone;
  chapter_length: ChapterLength;
  ai_model: string | null;
  status: StoryStatus;
  is_public: boolean;
  chapter_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  story_id: string;
  chapter_number: number;
  chapter_title: string | null;
  content: string;
  summary: string | null;
  parent_chapter_id: string | null;
  choice_made: string | null;
  created_at: string;
}

export interface Choice {
  id: string;
  chapter_id: string;
  choice_text: string;
  choice_order: number;
  is_selected: boolean;
}

// ===== AI Response =====
export interface AIStoryResponse {
  chapter_title: string;
  content: string;
  choices: string[];
  summary: string;
  is_dead?: boolean;
  is_ending?: boolean;
  power_level?: string;
}

export interface AIRandomSetupResponse {
  title: string;
  premise: string;
  world_setting: string;
  cultivation_system: string;
  ending_goal: string;
  character_name: string;
  character_description: string;
  companion_name: string;
  companion_role: string;
  companion_description: string;
  companion_goal: string;
  companion_arc: string;
}

// ===== Story Setup Form =====
export interface StorySetup {
  title: string;
  genre: string;
  premise: string;
  world_setting: string;
  cultivation_system: string;
  ending_goal: string;
  character_name: string;
  character_description: string;
  companion_name: string;
  companion_role: string;
  companion_description: string;
  companion_goal: string;
  companion_arc: string;
  tone: StoryTone;
  chapter_length: ChapterLength;
  ai_model: string;
}

// ===== Guest Session =====
export interface GuestSession {
  id: string;
  session_token: string;
  chapters_used: number;
  created_at: string;
}

// ===== Game State =====
export interface GameState {
  story: Story | null;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  currentChoices: Choice[];
  isGenerating: boolean;
  error: string | null;
}
