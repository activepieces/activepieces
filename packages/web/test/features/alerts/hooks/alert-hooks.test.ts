/**
 * @vitest-environment jsdom
 */
import { Alert, AlertChannel, ProjectWithLimits } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const alertsApi = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/alerts/api/alerts-api', () => ({ alertsApi }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'current' },
}));

import {
  alertMutations,
  platformProjectAlertsKeys,
} from '@/features/alerts/hooks/alert-hooks';

const ALERT: Alert = {
  id: 'alert-1',
  created: '',
  updated: '',
  projectId: 'p1',
  channel: AlertChannel.EMAIL,
  receiver: 'ops@example.com',
};

const setup = <T>(hook: () => T) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(platformProjectAlertsKeys.project('p1'), [ALERT]);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(hook, { wrapper });
  return { result, queryClient };
};

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  Object.values(alertsApi).forEach((fn) => fn.mockReset());
});

describe('usePlatformProjectAlertEmails', () => {
  it('removes the email at once and undo adds it back', async () => {
    let finish!: () => void;
    alertsApi.delete.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    alertsApi.list.mockResolvedValue({ data: [] });
    const { result, queryClient } = setup(() =>
      alertMutations.usePlatformProjectAlertEmails({ projectId: 'p1' }),
    );

    act(() => result.current.remove(ALERT));

    await waitFor(() =>
      expect(
        queryClient.getQueryData(platformProjectAlertsKeys.project('p1')),
      ).toEqual([]),
    );
    finish();
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(alertsApi.delete).toHaveBeenCalledWith('alert-1');

    alertsApi.create.mockResolvedValueOnce(ALERT);
    await act(async () => toast.success.mock.calls[0][1].action.onClick());

    await waitFor(() =>
      expect(toast.success).toHaveBeenLastCalledWith('Undone'),
    );
    expect(alertsApi.create).toHaveBeenCalledWith({
      channel: AlertChannel.EMAIL,
      projectId: 'p1',
      receiver: 'ops@example.com',
    });
  });

  it('rejects the add so the input keeps the email when the server fails', async () => {
    alertsApi.create.mockRejectedValueOnce(new Error('down'));
    const { result, queryClient } = setup(() =>
      alertMutations.usePlatformProjectAlertEmails({ projectId: 'p1' }),
    );

    await act(async () => {
      await expect(result.current.add('new@example.com')).rejects.toThrow(
        'down',
      );
    });

    expect(
      queryClient.getQueryData(platformProjectAlertsKeys.project('p1')),
    ).toEqual([ALERT]);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});

describe('useBulkSubscribeAlerts', () => {
  it('refreshes every project alert list and undo deletes what it created', async () => {
    alertsApi.create.mockResolvedValue({ ...ALERT, id: 'created-1' });
    alertsApi.delete.mockResolvedValue(undefined);
    const { result, queryClient } = setup(() =>
      alertMutations.useBulkSubscribeAlerts(),
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await act(() =>
      result.current.mutateAsync({
        email: 'ops@example.com',
        projects: [{ id: 'p2' } as ProjectWithLimits],
      }),
    );

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: platformProjectAlertsKeys.all,
    });
    await act(async () => toast.success.mock.calls[0][1].action.onClick());
    await waitFor(() =>
      expect(alertsApi.delete).toHaveBeenCalledWith('created-1'),
    );
  });
});
