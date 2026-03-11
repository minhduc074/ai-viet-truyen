import { AIStoryResponse } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateStoryChapter(
  systemPrompt: string,
  userPrompt: string,
  previousMessages: OpenRouterMessage[] = []
): Promise<AIStoryResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    ...previousMessages,
    { role: "user", content: userPrompt },
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Viết Truyện",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages,
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in AI response");
  }

  const parsed = JSON.parse(content) as AIStoryResponse;

  // Validate response structure
  if (!parsed.chapter_title || !parsed.content || !parsed.choices || !parsed.summary) {
    throw new Error("Invalid AI response structure");
  }

  if (!Array.isArray(parsed.choices) || parsed.choices.length < 2) {
    throw new Error("AI response must contain at least 2 choices");
  }

  return {
    chapter_title: String(parsed.chapter_title),
    content: String(parsed.content),
    choices: parsed.choices.slice(0, 4).map(String),
    summary: String(parsed.summary),
  };
}
