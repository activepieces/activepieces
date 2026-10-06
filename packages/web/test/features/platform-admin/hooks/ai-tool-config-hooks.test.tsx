/**
 * @vitest-environment jsdom
 */
import {
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
  AiToolProvider,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const api = vi.hoisted(() => ({
  list: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) => values?.[name] ?? match),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'CLOUD' }) },
}));
vi.mock('@/features/platform-admin/api/ai-tool-config-api', () => ({
  aiToolConfigApi: api,
}));

import {
  aiToolConfigKeys,
  aiToolConfigMutations,
} from '@/features/platform-admin/hooks/ai-tool-config-hooks';

const SEARCH: AiToolConfigWithoutSensitiveData = {
  id: 'config-1',
  capability: AiToolCapability.WEB_SEARCH,
  provider: AiToolProvider.AI_PROVIDER,
  config: { aiProviderId: 'provider-1' },
  enabled: true,
  hasApiKey: false,
};

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(aiToolConfigKeys.all, [SEARCH]);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => aiToolConfigMutations.useDisconnectWithUndo(),
    { wrapper },
  );
  return {
    result,
    cached: () =>
      queryClient.getQueryData<AiToolConfigWithoutSensitiveData[]>(
        aiToolConfigKeys.all,
      ),
  };
};

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.list.mockResolvedValue([]);
  api.delete.mockResolvedValue(undefined);
  api.upsert.mockResolvedValue(undefined);
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('aiToolConfigMutations.useDisconnectWithUndo', () => {
  it('removes the capability at once and offers undo that sets it up again', async () => {
    const { result, cached } = setup();

    act(() =>
      result.current.mutate({
        type: 'disconnect',
        config: SEARCH,
        name: 'Web search',
      }),
    );

    await waitFor(() => expect(cached()).toEqual([]));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(api.delete).toHaveBeenCalledWith('config-1');
    const [message, options] = toast.success.mock.calls[0];
    expect(message).toBe('Web search disconnected');

    await act(async () => options.action.onClick());

    await waitFor(() =>
      expect(api.upsert).toHaveBeenCalledWith({
        capability: AiToolCapability.WEB_SEARCH,
        provider: AiToolProvider.AI_PROVIDER,
        config: { aiProviderId: 'provider-1' },
        enabled: true,
      }),
    );
  });

  it('brings the row back and shows one error when the disconnect fails', async () => {
    api.delete.mockRejectedValueOnce(new Error('nope'));
    const { result, cached } = setup();

    act(() =>
      result.current.mutate({
        type: 'disconnect',
        config: SEARCH,
        name: 'Web search',
      }),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cached()).toEqual([SEARCH]);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
