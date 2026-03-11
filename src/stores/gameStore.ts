import { create } from "zustand";
import { Story, Chapter, Choice, StorySetup, AIStoryResponse } from "@/types";

interface GameStore {
  // State
  story: Story | null;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  currentChoices: Choice[];
  isGenerating: boolean;
  error: string | null;
  setup: StorySetup | null;

  // Actions
  setSetup: (setup: StorySetup) => void;
  setStory: (story: Story) => void;
  addChapter: (chapter: Chapter, choices: Choice[]) => void;
  setCurrentChapter: (chapter: Chapter, choices: Choice[]) => void;
  setGenerating: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // API actions
  createStory: (setup: StorySetup, guestToken?: string | null) => Promise<string | null>;
  generateChapter: (storyId: string, choiceMade?: string) => Promise<void>;
  loadStory: (storyId: string) => Promise<void>;
}

const initialState = {
  story: null,
  chapters: [],
  currentChapter: null,
  currentChoices: [],
  isGenerating: false,
  error: null,
  setup: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setSetup: (setup) => set({ setup }),

  setStory: (story) => set({ story }),

  addChapter: (chapter, choices) =>
    set((state) => ({
      chapters: [...state.chapters, chapter],
      currentChapter: chapter,
      currentChoices: choices,
    })),

  setCurrentChapter: (chapter, choices) =>
    set({ currentChapter: chapter, currentChoices: choices }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),

  createStory: async (setup, guestToken) => {
    try {
      set({ error: null });
      const res = await fetch("/api/story/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...setup, guestToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể tạo truyện");
      }
      const data = await res.json();
      set({ story: data.story, setup });
      return data.story.id;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  generateChapter: async (storyId, choiceMade) => {
    try {
      set({ isGenerating: true, error: null });
      const res = await fetch("/api/story/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, choiceMade }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể tạo chapter");
      }
      const data = await res.json();
      const { chapter, choices, story } = data;
      set((state) => ({
        story: story || state.story,
        chapters: [...state.chapters, chapter],
        currentChapter: chapter,
        currentChoices: choices,
        isGenerating: false,
      }));
    } catch (err) {
      set({ isGenerating: false, error: (err as Error).message });
    }
  },

  loadStory: async (storyId) => {
    try {
      set({ error: null });
      const res = await fetch(`/api/story/${storyId}`);
      if (!res.ok) throw new Error("Không thể tải truyện");
      const data = await res.json();
      const { story, chapters, currentChoices } = data;
      const currentChapter = chapters[chapters.length - 1] || null;
      set({ story, chapters, currentChapter, currentChoices });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
