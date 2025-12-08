export type ProviderChoice = "openai" | "anthropic" | "gemini";

export interface RoutingInput {
  userPrompt: string;
  systemPrompt?: string;
  contextJson?: unknown;
}

export interface RoutingDecision {
  provider: ProviderChoice;
  model: string;
  reason: string;
}

function estimateLength(text: string | undefined): number {
  if (!text) return 0;
  return text.length;
}

function hasReasoningKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "reason",
    "explain",
    "analyze",
    "analysis",
    "step by step",
    "chain of thought",
    "ragionamento",
    "spiega",
    "analizza",
  ];
  return keywords.some((k) => lower.includes(k));
}

function hasCodeKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "code",
    "typescript",
    "javascript",
    "python",
    "debug",
    "refactor",
    "bug",
    "stack trace",
  ];
  return keywords.some((k) => lower.includes(k));
}

export function routeProviderAndModel(input: RoutingInput): RoutingDecision {
  const userLen = estimateLength(input.userPrompt);
  const systemLen = estimateLength(input.systemPrompt);
  const totalLen = userLen + systemLen;

  // 1) Short, casual, low-cost → Gemini Flash
  if (totalLen < 400 && !hasReasoningKeywords(input.userPrompt)) {
    return {
      provider: "gemini",
      model: "gemini-1.5-flash",
      reason: "Short prompt, low latency and low cost → Gemini Flash",
    };
  }

  // 2) Heavy reasoning or analysis → Claude Sonnet
  if (hasReasoningKeywords(input.userPrompt)) {
    return {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20240620",
      reason: "Reasoning-heavy prompt → Claude 3.5 Sonnet",
    };
  }

  // 3) Code-related / technical → OpenAI GPT-4o-mini
  if (hasCodeKeywords(input.userPrompt)) {
    return {
      provider: "openai",
      model: "gpt-4o-mini",
      reason: "Code/technical task → GPT-4o mini",
    };
  }

  // 4) Long context → Claude Sonnet
  if (totalLen > 2000) {
    return {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20240620",
      reason: "Long context → Claude 3.5 Sonnet (large context window)",
    };
  }

  // 5) Default: OpenAI GPT-4o-mini
  return {
    provider: "openai",
    model: "gpt-4o-mini",
    reason: "Default route → GPT-4o mini",
  };
}
