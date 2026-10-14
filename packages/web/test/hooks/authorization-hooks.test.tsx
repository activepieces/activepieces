// @vitest-environment jsdom
import { ApEdition } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProjectId = vi.fn<() => string | null>();
const getCurrentProjectRole = vi.fn();
const getCurrentPlatform = vi.fn();

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: ApEdition.ENTERPRISE }) },
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { getCurrentUserPlatformRole: () => null },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getPlatformId: () => 'platform_1',
    getProjectId: () => getProjectId(),
  },
}));
vi.mock('@/api/platforms-api', () => ({
  platformApi: { getCurrentPlatform: () => getCurrentPlatform() },
}));
vi.mock('@/api/authentication-api', () => ({
  authenticationApi: {
    getCurrentProjectRole: (query: unknown) => getCurrentProjectRole(query),
  },
}));

import { useAuthorization } from '@/hooks/authorization-hooks';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAuthorization', () => {
  beforeEach(() => {
    getProjectId.mockReset();
    getCurrentProjectRole.mockReset();
    getCurrentPlatform.mockReset();
    getCurrentPlatform.mockResolvedValue({
      plan: { projectRolesEnabled: true },
    });
    getCurrentProjectRole.mockResolvedValue(null);
  });

  it('does not request the project role without a project id', async () => {
    getProjectId.mockReturnValue(null);
    const { result } = renderHook(() => useAuthorization(), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getCurrentPlatform).not.toHaveBeenCalled();
    expect(getCurrentProjectRole).not.toHaveBeenCalled();
    expect(result.current.isFetchingProjectRole).toBe(false);
  });

  it('does not request the project role with an empty project id', async () => {
    getProjectId.mockReturnValue('');
    renderHook(() => useAuthorization(), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getCurrentProjectRole).not.toHaveBeenCalled();
  });

  it('requests the project role for the current project', async () => {
    getProjectId.mockReturnValue('project_1');
    renderHook(() => useAuthorization(), { wrapper });
    await waitFor(() =>
      expect(getCurrentProjectRole).toHaveBeenCalledWith({
        projectId: 'project_1',
      }),
    );
  });
});
