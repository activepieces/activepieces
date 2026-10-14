/**
 * @vitest-environment jsdom
 */
import { PlatformModelTier } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  platformModelTierKeys,
  platformModelTierMutations,
} from '@/features/platform-admin/hooks/platform-model-tier-hooks';

const state = vi.hoisted(() => ({
  update: vi.fn(),
}));

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/features/platform-admin/api/platform-model-tier-api', () => ({
  platformModelTierApi: {
    update: (args: unknown) => state.update(args),
    listAdmin: () => new Promise(() => undefined),
  },
}));

function tier(
  id: string,
  overrides: Partial<PlatformModelTier> = {},
): PlatformModelTier {
  return {
    id,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    platformId: 'p',
    name: id,
    emoji: '⚡',
    description: null,
    position: 0,
    entries: [],
    isDefault: false,
    isFast: false,
    thinkingBudget: null,
    deleted: null,
    replacedBy: null,
    ...overrides,
  };
}

function tiersIn(queryClient: QueryClient): PlatformModelTier[] {
  return (
    queryClient.getQueryData<PlatformModelTier[]>(
      platformModelTierKeys.admin,
    ) ?? []
  );
}

describe('tier update rollback', () => {
  it('gives the default and fast markers back to the tiers that still hold them', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    queryClient.setQueryData(platformModelTierKeys.admin, [
      tier('expert', { isDefault: true }),
      tier('quick', { isFast: true }),
      tier('cheap'),
    ]);
    let fail: (error: Error) => void = () => undefined;
    state.update = vi.fn(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    );
    const { result } = renderHook(
      () => platformModelTierMutations.useUpdate({ feedback: 'silent' }),
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    let pending: Promise<unknown> = Promise.resolve();
    await act(async () => {
      pending = result.current
        .mutateAsync({
          id: 'cheap',
          request: { isDefault: true, isFast: true },
        })
        .catch(() => undefined);
    });
    expect(tiersIn(queryClient).map((t) => t.isDefault)).toEqual([
      false,
      false,
      true,
    ]);
    queryClient.setQueryData<PlatformModelTier[]>(
      platformModelTierKeys.admin,
      (old) =>
        old?.map((t) => (t.id === 'quick' ? { ...t, name: 'Quick edit' } : t)),
    );

    await act(async () => {
      fail(new Error('Server rejected'));
      await pending;
    });

    const [expert, quick, cheap] = tiersIn(queryClient);
    expect(expert.isDefault).toBe(true);
    expect(quick.isFast).toBe(true);
    expect(quick.name).toBe('Quick edit');
    expect(cheap.isDefault).toBe(false);
    expect(cheap.isFast).toBe(false);
  });
});
