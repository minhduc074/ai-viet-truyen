import { AIRandomSetupResponse, AIStoryResponse } from "@/types";
import { DEFAULT_MODEL } from "./models";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_RETRIES = 10;
const INITIAL_DELAY_MS = 1000;

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

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful or non-retryable error, return immediately
      if (response.ok) {
        return response;
      }

      // Retry on 429 (rate limit) or 5xx (server errors)
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        lastError = new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        
        if (attempt < maxRetries) {
          const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[OpenRouter] Retry ${attempt}/${maxRetries} after ${delay}ms (status: ${response.status})`);
          await sleep(delay);
          continue;
        }
      }

      // Non-retryable error
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    } catch (err) {
      // Network error - retry
      if (err instanceof TypeError && attempt < maxRetries) {
        lastError = err;
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[OpenRouter] Network error, retry ${attempt}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

export async function generateStoryChapter(
  systemPrompt: string,
  userPrompt: string,
  previousMessages: OpenRouterMessage[] = [],
  model: string = DEFAULT_MODEL
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

  const response = await fetchWithRetry(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Viet Truyen",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
    }),
  });

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
  if (!parsed.chapter_title || !parsed.content || !parsed.summary) {
    throw new Error("Invalid AI response structure");
  }

  // choices can be empty if character died or story ended
  const isEnding = parsed.is_dead === true || parsed.is_ending === true;
  if (!isEnding && (!Array.isArray(parsed.choices) || parsed.choices.length < 2)) {
    throw new Error("AI response must contain at least 2 choices (unless ending)");
  }

  return {
    chapter_title: String(parsed.chapter_title),
    content: String(parsed.content),
    choices: Array.isArray(parsed.choices) ? parsed.choices.slice(0, 4).map(String) : [],
    summary: String(parsed.summary),
    is_dead: parsed.is_dead === true,
    is_ending: parsed.is_ending === true,
    power_level: parsed.power_level ? String(parsed.power_level) : undefined,
  };
}

export async function generateRandomSetup(genre: string, model: string = DEFAULT_MODEL): Promise<AIRandomSetupResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetchWithRetry(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Viet Truyen",
    },
    body: JSON.stringify({
      model,
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
    }),
  });

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
