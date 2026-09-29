// @vitest-environment jsdom
import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModel,
  AIProviderModelType,
  ALLOWED_CHAT_MODELS_BY_PROVIDER,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

const listModelTiers = vi.fn();
const listModelsForProvider = vi.fn();
vi.mock('@/features/platform-admin/api/ai-provider-api', () => ({
  aiProviderApi: {
    listModelTiers: () => listModelTiers(),
    listModelsForProvider: (provider: string) =>
      listModelsForProvider(provider),
  },
}));

import { aiModelHooks } from '@/features/agents/ai-model/hooks';
import type { ModelTiersResponse } from '@/features/platform-admin/api/ai-provider-api';

describe('aiModelHooks.useGetModelsForProvider', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    listModelTiers.mockReset();
    listModelsForProvider.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('offers the published flow tiers, labelled by tier, and never a chat-only model', async () => {
    listModelTiers.mockResolvedValue(PUBLISHED);
    listModelsForProvider.mockResolvedValue(MANAGED_MODELS);

    const { result } = renderModels(AIProviderName.ACTIVEPIECES);

    await waitFor(() =>
      expect(result.current.data?.map((model) => model.id)).toEqual([
        'anthropic/claude-haiku-4.5',
        'anthropic/claude-sonnet-5',
      ]),
    );
    expect(result.current.data?.map((model) => model.name)).toEqual([
      'Fast',
      'Expert',
    ]);
  });

  it('falls back to the bundled tiers when the tiers request fails', async () => {
    listModelTiers.mockRejectedValue(new Error('tiers endpoint down'));
    listModelsForProvider.mockResolvedValue(MANAGED_MODELS);

    const { result } = renderModels(AIProviderName.ACTIVEPIECES);

    await waitFor(() =>
      expect(result.current.data?.map((model) => model.id)).toEqual([
        'anthropic/claude-haiku-4.5',
        'anthropic/claude-sonnet-4.6',
      ]),
    );
    expect(result.current.data?.map((model) => model.name)).toEqual([
      'Fast',
      'Expert',
    ]);
  });

  it('keeps the same list object across renders once resolved', async () => {
    listModelTiers.mockResolvedValue(PUBLISHED);
    listModelsForProvider.mockResolvedValue(MANAGED_MODELS);

    const { result, rerender } = renderModels(AIProviderName.ACTIVEPIECES);
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    const resolved = result.current.data;

    rerender();

    expect(result.current.data).toBe(resolved);
  });

  it('leaves a curated own-key provider on its curated list, unlabelled', async () => {
    const curatedId =
      ALLOWED_CHAT_MODELS_BY_PROVIDER[AIProviderName.OPENAI]![0];
    listModelTiers.mockResolvedValue(PUBLISHED);
    listModelsForProvider.mockResolvedValue([
      model({ id: curatedId, name: 'Curated model' }),
      model({ id: 'not-curated', name: 'Not curated' }),
    ]);

    const { result } = renderModels(AIProviderName.OPENAI);

    await waitFor(() =>
      expect(result.current.data?.map((model) => model.name)).toEqual([
        'Curated model',
      ]),
    );
  });

  function renderModels(provider: AIProviderName) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => aiModelHooks.useGetModelsForProvider(provider), {
      wrapper,
    });
  }
});

function model({
  id,
  name,
  type = AIProviderModelType.TEXT,
}: {
  id: string;
  name: string;
  type?: AIProviderModelType;
}): AIProviderModel {
  return { id, name, type };
}

const MANAGED_MODELS: AIProviderModel[] = [
  model({ id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6' }),
  model({ id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5' }),
  model({ id: 'google/gemini-3.7-flash', name: 'Gemini 3.7 Flash' }),
  model({ id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5' }),
  model({
    id: 'google/gemini-3.1-flash-image',
    name: 'Gemini Image',
    type: AIProviderModelType.IMAGE,
  }),
];

const PUBLISHED: ModelTiersResponse = {
  flow: {
    tiers: [
      { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5' },
      { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-5' },
      { id: 'premium', label: 'Heavy', modelId: 'anthropic/claude-opus-4.8' },
    ],
    defaultTierId: 'smart',
  },
  chat: {
    tiers: [
      { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5' },
      { id: 'smart', label: 'Expert', modelId: 'google/gemini-3.7-flash' },
      { id: 'turbo', label: 'Turbo', modelId: 'openai/gpt-5.5' },
    ],
    defaultTierId: 'turbo',
  },
};
