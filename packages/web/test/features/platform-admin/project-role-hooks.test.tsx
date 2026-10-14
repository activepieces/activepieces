// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listProjectRoles = vi.fn();
vi.mock('@/features/platform-admin/api/project-role-api', () => ({
  projectRoleApi: { list: () => listProjectRoles() },
}));

import { projectRoleQueries } from '@/features/platform-admin/hooks/project-role-hooks';

describe('projectRoleQueries.useProjectRoles', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    listProjectRoles.mockReset();
    queryClient = new QueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('shows the error after the first failure instead of retrying behind the skeleton', async () => {
    listProjectRoles.mockRejectedValue(new Error('500'));

    const { result } = renderHook(
      () =>
        projectRoleQueries.useProjectRoles({ enabled: true, failFast: true }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 500,
    });
    expect(listProjectRoles).toHaveBeenCalledTimes(1);
  });
});
