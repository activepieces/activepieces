/**
 * @vitest-environment jsdom
 */
import { AIProviderWithoutSensitiveData } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const update = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) => values?.[name] ?? match),
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'CLOUD' }) },
}));
vi.mock('@/features/platform-admin/api/ai-provider-api', () => ({
  aiProviderApi: { update },
}));

import {
  aiProviderKeys,
  aiProviderMutations,
} from '@/features/platform-admin/hooks/ai-provider-hooks';

const provider = ({
  id,
  name,
  enabledForChat,
}: {
  id: string;
  name: string;
  enabledForChat: boolean;
}) => ({ id, name, enabledForChat } as AIProviderWithoutSensitiveData);

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(aiProviderKeys.configs, [
    provider({ id: 'a', name: 'Anthropic key', enabledForChat: true }),
    provider({ id: 'b', name: 'OpenAI key', enabledForChat: false }),
  ]);
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => aiProviderMutations.useSetChatProvider(),
    { wrapper },
  );
  const chatKey = () =>
    queryClient
      .getQueryData<AIProviderWithoutSensitiveData[]>(aiProviderKeys.configs)
      ?.find((item) => item.enabledForChat)?.id;
  return { result, chatKey, invalidate };
};

beforeEach(() => {
  update.mockReset();
  update.mockResolvedValue(undefined);
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('aiProviderMutations.useSetChatProvider', () => {
  it('moves chat to the chosen key at once, refreshes project providers and undoes to the old key', async () => {
    const { result, chatKey, invalidate } = setup();

    act(() =>
      result.current.mutate({ providerId: 'b', displayName: 'OpenAI key' }),
    );

    await waitFor(() => expect(chatKey()).toBe('b'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith('b', {
      displayName: 'OpenAI key',
      enabledForChat: true,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ai-providers'] });
    const [message, options] = toast.success.mock.calls[0];
    expect(message).toBe('OpenAI key now answers in chat');

    await act(async () => options.action.onClick());

    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith('a', {
        displayName: 'Anthropic key',
        enabledForChat: true,
      }),
    );
  });

  it('keeps the old key and shows one error when the change fails', async () => {
    update.mockRejectedValueOnce(new Error('nope'));
    const { result, chatKey } = setup();

    act(() =>
      result.current.mutate({ providerId: 'b', displayName: 'OpenAI key' }),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(chatKey()).toBe('a');
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
