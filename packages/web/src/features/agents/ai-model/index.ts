import { AIProviderName } from '@activepieces/core-utils';

export const PROVIDER_EMBEDDING_MODELS: Partial<
  Record<AIProviderName, string>
> = {
  [AIProviderName.OPENAI]: 'text-embedding-3-small',
  [AIProviderName.GOOGLE]: 'text-embedding-004',
  [AIProviderName.AZURE]: 'text-embedding-3-small',
  [AIProviderName.ACTIVEPIECES]: 'text-embedding-3-small',
  [AIProviderName.OPENROUTER]: 'openai/text-embedding-3-small',
};
