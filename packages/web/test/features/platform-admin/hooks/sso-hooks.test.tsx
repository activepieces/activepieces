/**
 * @vitest-environment jsdom
 */
import { PlatformWithoutSensitiveData } from '@activepieces/shared';
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
  authenticationSession: { getPlatformId: () => 'platform-1' },
}));
vi.mock('@/api/platforms-api', () => ({ platformApi: { update } }));

import {
  platformListChange,
  ssoMutations,
} from '@/features/platform-admin/hooks/sso-hooks';

const KEY = ['platform', 'platform-1'];

const setup = <T,>(hook: () => T, platform: Partial<Platform> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(KEY, {
    emailAuthEnabled: true,
    googleAuthEnabled: false,
    allowedAuthDomains: ['acme.com'],
    enforceAllowedAuthDomains: true,
    ...platform,
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(hook, { wrapper });
  return {
    result,
    cached: () => queryClient.getQueryData<Platform>(KEY),
  };
};

const undoAction = () => {
  const options = toast.success.mock.calls.at(-1)?.[1];
  return options?.action as { label: string; onClick: () => void };
};

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  update.mockReset();
  update.mockResolvedValue({});
});

describe('platformListChange', () => {
  it('adds once and removes by value', () => {
    expect(
      platformListChange.apply({
        list: ['a.com'],
        change: { type: 'add', value: 'a.com' },
      }),
    ).toEqual(['a.com']);
    expect(
      platformListChange.apply({
        list: ['a.com', 'b.com'],
        change: { type: 'remove', value: 'a.com' },
      }),
    ).toEqual(['b.com']);
  });

  it('inverts an add into a remove of the same value', () => {
    expect(platformListChange.invert({ type: 'add', value: 'a.com' })).toEqual({
      type: 'remove',
      value: 'a.com',
    });
  });
});

describe('ssoMutations.useToggleSignInMethod', () => {
  it('flips the switch before the server answers and offers undo', async () => {
    let finish: (value: unknown) => void = () => undefined;
    update.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const { result, cached } = setup(() =>
      ssoMutations.useToggleSignInMethod(),
    );

    act(() => result.current.mutate({ method: 'google', enabled: true }));

    await waitFor(() => expect(cached()?.googleAuthEnabled).toBe(true));
    expect(update).toHaveBeenCalledWith(
      { googleAuthEnabled: true },
      'platform-1',
    );
    finish({});
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(toast.success.mock.calls[0][0]).toBe('Google sign-in turned on');

    await act(async () => undoAction().onClick());

    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        { googleAuthEnabled: false },
        'platform-1',
      ),
    );
  });

  it('puts the switch back and shows one error when the save fails', async () => {
    update.mockRejectedValueOnce(new Error('nope'));
    const { result, cached } = setup(() =>
      ssoMutations.useToggleSignInMethod(),
    );

    act(() => result.current.mutate({ method: 'email', enabled: false }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cached()?.emailAuthEnabled).toBe(true);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('ssoMutations.useAllowedDomains', () => {
  it('shows the new domain at once and sends the latest list', async () => {
    const { result, cached } = setup(() => ssoMutations.useAllowedDomains());

    await act(() =>
      result.current.mutateAsync({ type: 'add', value: 'example.com' }),
    );

    expect(cached()?.allowedAuthDomains).toEqual(['acme.com', 'example.com']);
    expect(update).toHaveBeenCalledWith(
      {
        allowedAuthDomains: ['acme.com', 'example.com'],
        enforceAllowedAuthDomains: true,
      },
      'platform-1',
    );
    expect(toast.success.mock.calls[0][0]).toBe('example.com added');
  });

  it('turns enforcement off when the last domain is removed, and undo puts it back', async () => {
    const { result } = setup(() => ssoMutations.useAllowedDomains());

    await act(() =>
      result.current.mutateAsync({ type: 'remove', value: 'acme.com' }),
    );
    expect(update).toHaveBeenLastCalledWith(
      { allowedAuthDomains: [], enforceAllowedAuthDomains: false },
      'platform-1',
    );

    await act(async () => undoAction().onClick());

    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        { allowedAuthDomains: ['acme.com'], enforceAllowedAuthDomains: true },
        'platform-1',
      ),
    );
  });

  it('rejects so the field keeps what was typed, and rolls the list back', async () => {
    update.mockRejectedValueOnce(new Error('nope'));
    const { result, cached } = setup(() => ssoMutations.useAllowedDomains());

    await act(async () => {
      await expect(
        result.current.mutateAsync({ type: 'add', value: 'example.com' }),
      ).rejects.toThrow('nope');
    });

    expect(cached()?.allowedAuthDomains).toEqual(['acme.com']);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});

type Platform = Pick<
  PlatformWithoutSensitiveData,
  | 'emailAuthEnabled'
  | 'googleAuthEnabled'
  | 'allowedAuthDomains'
  | 'enforceAllowedAuthDomains'
>;
