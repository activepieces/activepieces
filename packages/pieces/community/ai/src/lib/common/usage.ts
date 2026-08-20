import { AgentUsage, AgentUsageLlmCall } from '@activepieces/pieces-framework';
import type { LanguageModelUsage } from 'ai';

export function usageFromGeneration({ provider, requestedModel, result }: {
  provider?: string;
  requestedModel: string;
  result: GenerationResult;
}): AgentUsage | undefined {
  const steps = result.steps ?? [];
  const generations = steps.length > 0
    ? steps.map((step) => ({ usage: step.usage, servedModel: step.response?.modelId }))
    : result.totalUsage === undefined
      ? []
      : [{ usage: result.totalUsage, servedModel: result.response?.modelId }];
  if (generations.length === 0) {
    return undefined;
  }
  let incomplete = false;
  const calls: AgentUsageLlmCall[] = generations.map(({ usage, servedModel }) => {
    const inputTokens = finiteTokens(usage?.inputTokens);
    const outputTokens = finiteTokens(usage?.outputTokens);
    if (inputTokens === undefined || outputTokens === undefined) {
      incomplete = true;
    }
    const cachedInputTokens = finiteTokens(usage?.inputTokenDetails?.cacheReadTokens);
    const cacheWriteTokens = finiteTokens(usage?.inputTokenDetails?.cacheWriteTokens);
    const reasoningTokens = finiteTokens(usage?.outputTokenDetails?.reasoningTokens);
    return {
      ...(provider ? { provider } : {}),
      model: servedModel || requestedModel,
      inputTokens: inputTokens ?? 0,
      outputTokens: outputTokens ?? 0,
      ...(cachedInputTokens !== undefined ? { cachedInputTokens } : {}),
      ...(cacheWriteTokens !== undefined ? { cacheWriteTokens } : {}),
      ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
    };
  });
  return {
    version: 1,
    calls,
    totals: {
      inputTokens: calls.reduce((sum, call) => sum + call.inputTokens, 0),
      outputTokens: calls.reduce((sum, call) => sum + call.outputTokens, 0),
    },
    ...(incomplete ? { incomplete: true } : {}),
  };
}

function finiteTokens(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

type GenerationResult = {
  steps?: Array<{ usage?: LanguageModelUsage; response?: { modelId?: string } }>;
  response?: { modelId?: string };
  totalUsage?: LanguageModelUsage;
};
