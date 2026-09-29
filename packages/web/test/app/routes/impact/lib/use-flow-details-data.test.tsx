// @vitest-environment jsdom
import {
  FlowStatus,
  PlatformAnalyticsReport,
  PlatformRole,
  UserStatus,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createContext, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserById = vi.fn();
vi.mock('@/api/user-api', () => ({
  userApi: { getUserById: (id: string) => getUserById(id) },
}));

vi.mock('@/features/platform-admin', () => ({
  RefreshAnalyticsContext: createContext({
    timeSavedPerRunOverrides: {},
    setTimeSavedPerRunOverride: () => undefined,
  }),
}));

import { useFlowDetailsData } from '@/app/routes/impact/lib/use-flow-details-data';

describe('useFlowDetailsData owners', () => {
  beforeEach(() => {
    getUserById.mockReset();
  });

  it('names owners missing from a scoped report after the user the row shows', async () => {
    getUserById.mockResolvedValue({
      id: 'u9',
      firstName: 'Zed',
      lastName: 'Outside',
    });

    const { result } = renderOwners();

    await waitFor(() =>
      expect(result.current.uniqueOwners).toEqual([
        { id: 'u1', name: 'Alice Smith' },
        { id: 'u9', name: 'Zed Outside' },
      ]),
    );
    expect(getUserById).toHaveBeenCalledTimes(1);
    expect(getUserById).toHaveBeenCalledWith('u9');
  });

  it('keeps the owner id as the name when that user cannot be loaded, without caching the failure', async () => {
    getUserById.mockRejectedValue(new Error('unavailable'));

    const { result, queryClient } = renderOwners();

    await waitFor(() =>
      expect(queryClient.getQueryState(['user', 'u9'])?.status).toBe('error'),
    );
    expect(result.current.uniqueOwners).toEqual([
      { id: 'u1', name: 'Alice Smith' },
      { id: 'u9', name: 'u9' },
    ]);
  });
});

function renderOwners() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return {
    queryClient,
    ...renderHook(() => useFlowDetailsData(REPORT), { wrapper }),
  };
}

const REPORT: PlatformAnalyticsReport = {
  id: 'report',
  created: '2026-09-01T00:00:00.000Z',
  updated: '2026-09-01T00:00:00.000Z',
  cachedAt: '2026-09-01T00:00:00.000Z',
  outdated: false,
  platformId: 'platform',
  flows: [
    {
      flowId: 'a',
      flowName: 'a',
      projectId: 'project',
      projectName: 'Project',
      status: FlowStatus.ENABLED,
      timeSavedPerRun: null,
      ownerId: 'u1',
    },
    {
      flowId: 'b',
      flowName: 'b',
      projectId: 'project',
      projectName: 'Project',
      status: FlowStatus.ENABLED,
      timeSavedPerRun: null,
      ownerId: 'u9',
    },
  ],
  users: [
    {
      id: 'u1',
      email: 'u1@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      status: UserStatus.ACTIVE,
      externalId: null,
      platformId: 'platform',
      platformRole: PlatformRole.MEMBER,
      created: '2026-09-01T00:00:00.000Z',
      updated: '2026-09-01T00:00:00.000Z',
      lastActiveDate: null,
      imageUrl: null,
    },
  ],
  runs: [],
};
