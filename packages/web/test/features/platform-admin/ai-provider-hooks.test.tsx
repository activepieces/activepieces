// @vitest-environment jsdom
import {
  ACTIVEPIECES_CHAT_TIERS,
  DEFAULT_CHAT_TIER_ID,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

const listModelTiers = vi.fn();
vi.mock('@/features/platform-admin/api/ai-provider-api', () => ({
  aiProviderApi: { listModelTiers: () => listModelTiers() },
}));

import type {
  ModelTierList,
  ModelTiersResponse,
  ModelTierSurface,
} from '@/features/platform-admin/api/ai-provider-api';
import {
  aiProviderKeys,
  aiProviderQueries,
} from '@/features/platform-admin/hooks/ai-provider-hooks';

describe('aiProviderQueries.useModelTiers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    listModelTiers.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('serves the chat list for chat and the flow list for flow from one request', async () => {
    listModelTiers.mockResolvedValue(PUBLISHED);

    const { result: chat } = renderTiers('chat');
    await waitFor(() => expect(chat.current.defaultTierId).toBe('turbo'));
    expect(chat.current.tiers.map((tier) => tier.id)).toEqual([
      'fast',
      'smart',
      'turbo',
    ]);
    expect(modelIdOf(chat.current, 'smart')).toBe('google/gemini-3.7-flash');

    const { result: flow } = renderTiers('flow');
    await waitFor(() =>
      expect(modelIdOf(flow.current, 'smart')).toBe(
        'anthropic/claude-sonnet-5',
      ),
    );
    expect(flow.current.tiers.map((tier) => tier.id)).toEqual([
      'fast',
      'smart',
      'premium',
    ]);
    expect(flow.current.defaultTierId).toBe('smart');
    expect(listModelTiers).toHaveBeenCalledTimes(1);
  });

  it('serves the bundled list before the response lands', () => {
    listModelTiers.mockReturnValue(new Promise(() => undefined));

    const { result } = renderTiers('chat');

    expect(result.current).toEqual(BUNDLED);
  });

  it('serves the bundled list on both surfaces when the request fails', async () => {
    listModelTiers.mockRejectedValue(new Error('tiers endpoint down'));

    const { result: chat } = renderTiers('chat');
    const { result: flow } = renderTiers('flow');
    await waitFor(() =>
      expect(queryClient.getQueryState(aiProviderKeys.modelTiers)?.status).toBe(
        'error',
      ),
    );

    expect(chat.current).toEqual(BUNDLED);
    expect(flow.current).toEqual(BUNDLED);
  });

  function renderTiers(surface: ModelTierSurface) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => aiProviderQueries.useModelTiers(surface), {
      wrapper,
    });
  }
});

function modelIdOf(list: ModelTierList, tierId: string): string | undefined {
  return list.tiers.find((tier) => tier.id === tierId)?.modelId;
}

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

const BUNDLED: ModelTierList = {
  tiers: ACTIVEPIECES_CHAT_TIERS.map(({ id, label, modelId }) => ({
    id,
    label,
    modelId,
  })),
  defaultTierId: DEFAULT_CHAT_TIER_ID,
};
