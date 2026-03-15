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

function normalizeJsonLikeText(input: string): string {
  return input
    .replace(/^\uFEFF/, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\r\n/g, "\n")
    .trim();
}

function balanceCurlyBraces(input: string): string {
  const firstBrace = input.indexOf("{");
  if (firstBrace < 0) return input;

  const fromFirstBrace = input.slice(firstBrace);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < fromFirstBrace.length; i++) {
    const ch = fromFirstBrace[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") depth--;
  }

  if (depth > 0) {
    return fromFirstBrace + "}".repeat(depth);
  }

  return fromFirstBrace;
}

function repairJsonCommonIssues(input: string): string {
  const extracted = extractJsonString(normalizeJsonLikeText(input));
  const balanced = balanceCurlyBraces(extracted);

  return balanced
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function parseJsonWithRepairs<T>(raw: string): T {
  const jsonText = extractJsonString(raw);

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    const repaired = repairJsonCommonIssues(raw);
    return JSON.parse(repaired) as T;
  }
}

function extractStringValue(raw: string, key: string): string | null {
  const normalized = normalizeJsonLikeText(raw);
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`"${escapedKey}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "s");
  const match = normalized.match(pattern);

  if (!match?.[1]) return null;

  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function extractBooleanValue(raw: string, key: string): boolean | null {
  const normalized = normalizeJsonLikeText(raw);
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`"${escapedKey}"\\s*:\\s*(true|false)`, "i");
  const match = normalized.match(pattern);

  if (!match?.[1]) return null;
  return match[1].toLowerCase() === "true";
}

function extractChoicesValue(raw: string): string[] | null {
  const normalized = normalizeJsonLikeText(raw);
  const start = normalized.indexOf('"choices"');
  if (start < 0) return null;

  const arrayStart = normalized.indexOf("[", start);
  const arrayEnd = normalized.indexOf("]", arrayStart);
  if (arrayStart < 0 || arrayEnd < 0) return null;

  const arrayText = normalized.slice(arrayStart, arrayEnd + 1);
  try {
    const parsed = JSON.parse(arrayText);
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : null;
  } catch {
    const matches = [...arrayText.matchAll(/"((?:\\.|[^"\\])*)"/g)];
    return matches.map((match) => {
      try {
        return JSON.parse(`"${match[1]}"`) as string;
      } catch {
        return match[1];
      }
    });
  }
}

function extractMalformedContentValue(raw: string): string | null {
  const normalized = normalizeJsonLikeText(raw);
  const contentKeyIndex = normalized.indexOf('"content"');
  const choicesKeyIndex = normalized.indexOf('"choices"');

  if (contentKeyIndex < 0 || choicesKeyIndex < 0 || choicesKeyIndex <= contentKeyIndex) {
    return extractStringValue(raw, "content");
  }

  const colonIndex = normalized.indexOf(":", contentKeyIndex);
  if (colonIndex < 0) return null;

  const section = normalized.slice(colonIndex + 1, choicesKeyIndex);
  const matches = [...section.matchAll(/"((?:\\.|[^"\\])*)"/g)];
  if (matches.length === 0) return null;

  const fragments = matches
    .map((match) => {
      try {
        return JSON.parse(`"${match[1]}"`) as string;
      } catch {
        return match[1];
      }
    })
    .map((item) => item.trim())
    .filter(Boolean);

  return fragments.length > 0 ? fragments.join("\n\n") : null;
}

function parseStoryResponseFallback(raw: string): AIStoryResponse | null {
  const chapter_title = extractStringValue(raw, "chapter_title");
  const content = extractMalformedContentValue(raw);
  const summary = extractStringValue(raw, "summary");
  const choices = extractChoicesValue(raw);
  const is_dead = extractBooleanValue(raw, "is_dead") ?? false;
  const is_ending = extractBooleanValue(raw, "is_ending") ?? false;
  const power_level = extractStringValue(raw, "power_level") ?? undefined;

  if (!chapter_title || !content || !summary) {
    return null;
  }

  return {
    chapter_title,
    content,
    choices: choices || [],
    summary,
    is_dead,
    is_ending,
    power_level,
  };
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

  let parsed: AIStoryResponse;
  try {
    parsed = parseJsonWithRepairs<AIStoryResponse>(content);
  } catch {
    const fallback = parseStoryResponseFallback(content);
    if (!fallback) {
      throw new Error(
        `AI response is not valid JSON. Raw preview: ${content}`
      );
    }
    parsed = fallback;
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
            "Ban la tac gia sang tao truyen tuong tac. Tra ve DUY NHAT 1 object JSON hop le, khong markdown, khong giai thich, khong text ben ngoai JSON. Moi field phai nam dung trong object JSON do.",
        },
        {
          role: "user",
          content: `Hay random y tuong mo dau cho the loai ${genre}.\nTra ve JSON voi dung cac field sau:\n{\n  \"title\": \"ten truyen hap dan\",\n  \"premise\": \"tien de mo dau va xung dot khoi dau (3-5 cau)\",\n  \"world_setting\": \"boi canh the gioi co dinh de tat ca chapter sau phai tuan theo\",\n  \"cultivation_system\": \"he thong canh gioi/cap bac ro rang tu thap den cao nhat\",\n  \"ending_goal\": \"muc tieu ket thuc lon cua truyen, vi du bao thu, cuu gioi, dat canh gioi toi cao\",\n  \"character_name\": \"ten nhan vat chinh\",\n  \"character_description\": \"ngoai hinh + tinh cach + ky nang/noi luc\",\n  \"companion_name\": \"ten dong hanh cua nhan vat chinh\",\n  \"companion_role\": \"vai tro cua dong hanh\",\n  \"companion_description\": \"ngoai hinh, tinh cach, so truong va cach tu duy rieng\",\n  \"companion_goal\": \"muc tieu rieng cua dong hanh\",\n  \"companion_arc\": \"dong hanh bao lau va vi sao: mot chang duong hay ca hanh trinh\"\n}\nYeu cau: world_setting, cultivation_system va ending_goal phai du manh de lam canon cho suot bo truyen. Dong hanh phai co suy nghi rieng, khong duoc chi la NPC phu hoa. Khong duoc them bat ky field nao khac. Khong duoc chen markdown. Khong duoc them giai thich truoc hoac sau JSON. Moi gia tri van ban phai nam trong string hop le. Viet bang tieng Viet, ngan gon, de de tiep tuc viet chapter 1.`,
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

  let parsed: AIRandomSetupResponse;
  try {
    parsed = parseJsonWithRepairs<AIRandomSetupResponse>(content);
  } catch {
    throw new Error(`AI random setup is not valid JSON. Raw preview: ${content}`);
  }

  if (
    !parsed.title ||
    !parsed.premise ||
    !parsed.world_setting ||
    !parsed.cultivation_system ||
    !parsed.ending_goal ||
    !parsed.character_name ||
    !parsed.character_description ||
    !parsed.companion_name ||
    !parsed.companion_role ||
    !parsed.companion_description ||
    !parsed.companion_goal ||
    !parsed.companion_arc
  ) {
    throw new Error("Invalid AI random setup response structure");
  }

  return {
    title: String(parsed.title).trim(),
    premise: String(parsed.premise).trim(),
    world_setting: String(parsed.world_setting).trim(),
    cultivation_system: String(parsed.cultivation_system).trim(),
    ending_goal: String(parsed.ending_goal).trim(),
    character_name: String(parsed.character_name).trim(),
    character_description: String(parsed.character_description).trim(),
    companion_name: String(parsed.companion_name).trim(),
    companion_role: String(parsed.companion_role).trim(),
    companion_description: String(parsed.companion_description).trim(),
    companion_goal: String(parsed.companion_goal).trim(),
    companion_arc: String(parsed.companion_arc).trim(),
  };
}
