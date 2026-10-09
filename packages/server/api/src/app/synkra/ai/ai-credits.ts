/**
 * Synkra AI Credits — the unit of AI consumption.
 *
 * 1 credit = 1,000 tokens (input + output combined).
 * Fixed-cost operations bypass tokens entirely.
 *
 * Examples:
 *   2,500 tokens  → 3 credits
 *   18,500 tokens → 19 credits
 *   1 image       → 20 credits
 *   1 min audio   → 10 credits
 */

export const TOKENS_PER_CREDIT = 1000;

export const FIXED_COSTS = {
  IMAGE_GENERATION: 20,
  AUDIO_TRANSCRIPTION_PER_MINUTE: 10,
  EMBEDDING_1K: 1,
} as const;

export type FixedOperation = keyof typeof FIXED_COSTS;

export type AIConsumptionSource =
  | 'chat_with_ai'
  | 'flow_build'
  | 'ocr'
  | 'categorize'
  | 'translate'
  | 'summarize'
  | 'flow_step'
  | 'image_gen'
  | 'audio_transcribe'
  | 'embedding'
  | 'other';

export type AIConsumption = {
  source: AIConsumptionSource;
  credits: number;
  tokensUsed?: number;
  model?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Convert a token count to credits. Rounds UP so partial 1,000-token
 * blocks are always fully charged. Never returns less than 1 for any
 * non-zero token count.
 */
export function tokensToCredits(tokens: number): number {
  if (tokens <= 0) return 0;
  return Math.max(1, Math.ceil(tokens / TOKENS_PER_CREDIT));
}

/**
 * Pre-flight cost estimate. Used by the UI to warn before an expensive op.
 * Actual cost is always measured after the call; this is a hint only.
 */
export function estimateCredits(params: {
  promptChars?: number;
  maxOutputTokens?: number;
}): number {
  const promptTokens = Math.ceil((params.promptChars ?? 0) / 4);
  const outputTokens = params.maxOutputTokens ?? 500;
  return tokensToCredits(promptTokens + outputTokens);
}

export function fixedCost(op: FixedOperation): number {
  return FIXED_COSTS[op];
}
