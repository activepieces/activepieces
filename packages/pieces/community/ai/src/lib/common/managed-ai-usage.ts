import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { AIProviderName, isNil, spreadIfDefined, tryCatch } from '@activepieces/pieces-framework';

export function extractManagedAiCalls(result: unknown): ManagedAiCall[] {
  const record = asRecord(result);
  if (isNil(record)) {
    return [];
  }
  const steps = record['steps'];
  const sources = Array.isArray(steps) && steps.length > 0 ? steps : [record];
  return sources.flatMap((source) => {
    const call = toManagedAiCall(source);
    return isNil(call) ? [] : [call];
  });
}

export async function reportManagedAiUsage({
  provider,
  model,
  engineToken,
  apiUrl,
  flowId,
  flowRunId,
  result,
}: ReportManagedAiUsageParams): Promise<void> {
  if (provider !== AIProviderName.ACTIVEPIECES) {
    return;
  }
  const calls = extractManagedAiCalls(result);
  await tryCatch(() =>
    Promise.all(
      calls.map((call) =>
        httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${apiUrl}v1/ai-usage`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token: engineToken },
          body: {
            provider,
            model,
            generationId: call.generationId,
            costUsd: call.costUsd,
            ...spreadIfDefined('inputTokens', call.inputTokens),
            ...spreadIfDefined('outputTokens', call.outputTokens),
            ...spreadIfDefined('flowId', flowId),
            ...spreadIfDefined('flowRunId', flowRunId),
          },
        }),
      ),
    ),
  );
}

function toManagedAiCall(step: unknown): ManagedAiCall | undefined {
  const record = asRecord(step);
  if (isNil(record)) {
    return undefined;
  }
  const openRouter = asRecord(asRecord(record['providerMetadata'])?.['openrouter']);
  const usage = asRecord(openRouter?.['usage']);
  const generationId = readString(asRecord(record['response']), 'id');
  const costUsd = readNumber(usage, 'cost');
  if (isNil(generationId) || isNil(costUsd)) {
    return undefined;
  }
  return {
    generationId,
    costUsd,
    inputTokens: readNumber(usage, 'promptTokens'),
    outputTokens: readNumber(usage, 'completionTokens'),
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || isNil(value) || Array.isArray(value)) {
    return undefined;
  }
  return { ...value };
}

function readString(source: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = source?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(source: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = source?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export type ManagedAiCall = {
  generationId: string;
  costUsd: number;
  inputTokens?: number;
  outputTokens?: number;
};

type ReportManagedAiUsageParams = {
  provider: AIProviderName;
  model: string;
  engineToken: string;
  apiUrl: string;
  flowId?: string;
  flowRunId?: string;
  result: unknown;
};
