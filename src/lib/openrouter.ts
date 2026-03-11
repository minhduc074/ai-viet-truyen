import { AIRandomSetupResponse, AIStoryResponse } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function extractJsonString(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
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
      "X-Title": "AI Viet Truyen",
    },
    body: JSON.stringify({
      model: "arcee-ai/trinity-large-preview:free",
      messages,
      temperature: 0.8,
      max_tokens: 10000,
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

  const jsonText = extractJsonString(content);

  let parsed: AIStoryResponse;
  try {
    parsed = JSON.parse(jsonText) as AIStoryResponse;
  } catch {
    throw new Error(
      `AI response is not valid JSON. Raw preview: ${content.slice(0, 220)}`
    );
  }

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

export async function generateRandomSetup(genre: string): Promise<AIRandomSetupResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Viet Truyen",
    },
    body: JSON.stringify({
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "system",
          content:
            "Ban la tac gia sang tao truyen tuong tac. Tra ve DUY NHAT JSON hop le, khong markdown, khong giai thich.",
        },
        {
          role: "user",
          content: `Hay random y tuong mo dau cho the loai ${genre}.\nTra ve JSON voi dung 4 field:\n{\n  \"title\": \"ten truyen hap dan\",\n  \"premise\": \"boi canh + xung dot khoi dau (3-5 cau)\",\n  \"character_name\": \"ten nhan vat chinh\",\n  \"character_description\": \"ngoai hinh + tinh cach + ky nang/noi luc\"\n}\nViet bang tieng Viet, ngan gon, de de tiep tuc viet chapter 1.`,
        },
      ],
      temperature: 1,
      max_tokens: 700,
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

  const jsonText = extractJsonString(content);
  let parsed: AIRandomSetupResponse;
  try {
    parsed = JSON.parse(jsonText) as AIRandomSetupResponse;
  } catch {
    throw new Error(`AI random setup is not valid JSON. Raw preview: ${content.slice(0, 220)}`);
  }

  if (!parsed.title || !parsed.premise || !parsed.character_name || !parsed.character_description) {
    throw new Error("Invalid AI random setup response structure");
  }

  return {
    title: String(parsed.title).trim(),
    premise: String(parsed.premise).trim(),
    character_name: String(parsed.character_name).trim(),
    character_description: String(parsed.character_description).trim(),
  };
}
