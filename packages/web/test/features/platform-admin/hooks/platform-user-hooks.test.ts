/**
 * @vitest-environment jsdom
 */
import { SeekPage } from '@activepieces/core-utils';
import { UserStatus, UserWithMetaInformation } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const update = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    params?.name ? `${key}:${params.name}` : key,
}));
vi.mock('@/api/platform-user-api', () => ({
  platformUserApi: { update, list: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: {},
}));
vi.mock('@/hooks/authorization-hooks', () => ({ useAuthorization: vi.fn() }));
vi.mock('@/hooks/user-hooks', () => ({ userHooks: {} }));

import {
  platformUserKeys,
  platformUserMutations,
} from '@/features/platform-admin/hooks/platform-user-hooks';

const ADA = {
  id: 'ada',
  email: 'ada@example.com',
  status: UserStatus.ACTIVE,
} as UserWithMetaInformation;

const setup = ({
  onSeatLimitError = () => false,
}: { onSeatLimitError?: (error: Error) => boolean } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData<SeekPage<UserWithMetaInformation>>(
    platformUserKeys.users,
    { data: [ADA], next: null, previous: null },
  );
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(
    () => platformUserMutations.useUpdateUserStatus({ onSeatLimitError }),
    { wrapper },
  );
  const status = () =>
    queryClient.getQueryData<SeekPage<UserWithMetaInformation>>(
      platformUserKeys.users,
    )?.data[0].status;
  return { result, status };
};

const deactivate = {
  userId: 'ada',
  name: 'Ada',
  status: UserStatus.INACTIVE,
};

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  update.mockReset();
});

describe('useUpdateUserStatus', () => {
  it('flips the status before the server answers and offers undo', async () => {
    let finish!: () => void;
    update.mockImplementationOnce(
      () => new Promise((resolve) => (finish = () => resolve(ADA))),
    );
    const { result, status } = setup();

    act(() => result.current.change(deactivate));

    await waitFor(() => expect(status()).toBe(UserStatus.INACTIVE));
    expect(result.current.isPendingFor('ada')).toBe(true);
    finish();
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    const [message, options] = toast.success.mock.calls[0];
    expect(message).toBe('{name} deactivated:Ada');

    update.mockResolvedValueOnce(ADA);
    await act(async () => options.action.onClick());

    await waitFor(() =>
      expect(toast.success).toHaveBeenLastCalledWith('Undone'),
    );
    expect(update).toHaveBeenLastCalledWith('ada', {
      status: UserStatus.ACTIVE,
    });
  });

  it('ignores a second click while the first is saving', async () => {
    update.mockImplementation(() => new Promise(() => undefined));
    const { result } = setup();

    act(() => result.current.change(deactivate));
    await waitFor(() => expect(result.current.isPendingFor('ada')).toBe(true));
    act(() => result.current.change(deactivate));

    expect(update).toHaveBeenCalledTimes(1);
  });

  it('rolls back and shows one error when the save fails', async () => {
    update.mockRejectedValueOnce(new Error('nope'));
    const { result, status } = setup();

    act(() => result.current.change(deactivate));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(status()).toBe(UserStatus.ACTIVE);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('hands seat-limit errors to the seat dialog instead of a toast', async () => {
    update.mockRejectedValueOnce(new Error('quota'));
    const onSeatLimitError = vi.fn(() => true);
    const { result, status } = setup({ onSeatLimitError });

    act(() =>
      result.current.change({ ...deactivate, status: UserStatus.ACTIVE }),
    );

    await waitFor(() => expect(onSeatLimitError).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
    expect(status()).toBe(UserStatus.ACTIVE);
  });
});
