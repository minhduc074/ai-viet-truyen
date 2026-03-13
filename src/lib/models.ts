export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  weeklyTokens: string;
  released: string;
}

export const FREE_MODELS: AIModel[] = [
  {
    id: "openrouter/free",
    name: "random",
    provider: "OpenRouter",
    contextLength: 8192,
    weeklyTokens: "38.7M",
    released: "Jul 9, 2025",
  },
  {
    id: "arcee-ai/trinity-large-preview:free",
    name: "Trinity Large Preview",
    provider: "Arcee AI",
    contextLength: 131000,
    weeklyTokens: "541B",
    released: "Jan 28, 2026",
  },
  {
    id: "z-ai/glm-4.5-air:free",
    name: "GLM 4.5 Air",
    provider: "Z.ai",
    contextLength: 131072,
    weeklyTokens: "54.9B",
    released: "Jul 26, 2025",
  },
  {
    id: "nvidia/nemotron-3-super:free",
    name: "Nemotron 3 Super",
    provider: "NVIDIA",
    contextLength: 262144,
    weeklyTokens: "49.9B",
    released: "Mar 11, 2026",
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    name: "Nemotron 3 Nano 30B A3B",
    provider: "NVIDIA",
    contextLength: 256000,
    weeklyTokens: "35.6B",
    released: "Dec 14, 2025",
  },
  {
    id: "arcee-ai/trinity-mini:free",
    name: "Trinity Mini",
    provider: "Arcee AI",
    contextLength: 131072,
    weeklyTokens: "9.69B",
    released: "Dec 1, 2025",
  },
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    name: "Nemotron Nano 9B V2",
    provider: "NVIDIA",
    contextLength: 128000,
    weeklyTokens: "7.92B",
    released: "Sep 6, 2025",
  },
  {
    id: "nvidia/nemotron-nano-12b-2-vl:free",
    name: "Nemotron Nano 12B 2 VL",
    provider: "NVIDIA",
    contextLength: 128000,
    weeklyTokens: "7.22B",
    released: "Oct 29, 2025",
  },
  {
    id: "openai/gpt-oss-120b:free",
    name: "GPT-OSS-120B",
    provider: "OpenAI",
    contextLength: 131072,
    weeklyTokens: "1.37B",
    released: "Aug 6, 2025",
  },
  {
    id: "qwen/qwen3-coder-480b-a35b:free",
    name: "Qwen3 Coder 480B A35B",
    provider: "Qwen",
    contextLength: 262000,
    weeklyTokens: "1.18B",
    released: "Jul 23, 2025",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B Instruct",
    provider: "Meta",
    contextLength: 128000,
    weeklyTokens: "1.16B",
    released: "Dec 7, 2024",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    name: "Qwen3 Next 80B A3B Instruct",
    provider: "Qwen",
    contextLength: 262144,
    weeklyTokens: "865M",
    released: "Sep 12, 2025",
  },
  {
    id: "liquid/lfm2.5-1.2b-thinking:free",
    name: "LFM2.5-1.2B-Thinking",
    provider: "LiquidAI",
    contextLength: 32768,
    weeklyTokens: "711M",
    released: "Jan 20, 2026",
  },
  {
    id: "liquid/lfm2.5-1.2b-instruct:free",
    name: "LFM2.5-1.2B-Instruct",
    provider: "LiquidAI",
    contextLength: 32768,
    weeklyTokens: "451M",
    released: "Jan 20, 2026",
  },
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT-OSS-20B",
    provider: "OpenAI",
    contextLength: 131072,
    weeklyTokens: "440M",
    released: "Aug 6, 2025",
  },
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B",
    provider: "Google",
    contextLength: 131072,
    weeklyTokens: "418M",
    released: "Mar 12, 2025",
  },
  {
    id: "mistralai/mistral-small-3.1-24b:free",
    name: "Mistral Small 3.1 24B",
    provider: "Mistral",
    contextLength: 128000,
    weeklyTokens: "328M",
    released: "Mar 18, 2025",
  },
  {
    id: "qwen/qwen3-4b:free",
    name: "Qwen3 4B",
    provider: "Qwen",
    contextLength: 40960,
    weeklyTokens: "173M",
    released: "Apr 30, 2025",
  },
  {
    id: "venice/uncensored:free",
    name: "Uncensored",
    provider: "Venice",
    contextLength: 32768,
    weeklyTokens: "166M",
    released: "Jul 10, 2025",
  },
  {
    id: "nousresearch/hermes-3-405b-instruct:free",
    name: "Hermes 3 405B Instruct",
    provider: "Nous",
    contextLength: 131072,
    weeklyTokens: "84.8M",
    released: "Aug 16, 2024",
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B Instruct",
    provider: "Meta",
    contextLength: 131072,
    weeklyTokens: "83.3M",
    released: "Sep 25, 2024",
  },
  {
    id: "google/gemma-3-4b-it:free",
    name: "Gemma 3 4B",
    provider: "Google",
    contextLength: 32768,
    weeklyTokens: "70M",
    released: "Mar 14, 2025",
  },
  {
    id: "google/gemma-3n-4b-it:free",
    name: "Gemma 3n 4B",
    provider: "Google",
    contextLength: 8192,
    weeklyTokens: "49.2M",
    released: "May 21, 2025",
  },
  {
    id: "google/gemma-3-12b-it:free",
    name: "Gemma 3 12B",
    provider: "Google",
    contextLength: 32768,
    weeklyTokens: "45.5M",
    released: "Mar 14, 2025",
  },
  {
    id: "google/gemma-3n-2b-it:free",
    name: "Gemma 3n 2B",
    provider: "Google",
    contextLength: 8192,
    weeklyTokens: "38.7M",
    released: "Jul 9, 2025",
  },
];

export const DEFAULT_MODEL = "openrouter/free";

export function getModelById(id: string): AIModel | undefined {
  return FREE_MODELS.find((m) => m.id === id);
}

export function getModelName(id: string): string {
  const model = getModelById(id);
  return model ? `${model.provider}: ${model.name}` : id;
}
