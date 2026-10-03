// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/ui/sonner', () => ({ internalErrorToast: vi.fn() }));

const getProjectId = vi.fn();
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => getProjectId() },
}));

const list = vi.fn();
vi.mock('@/features/project-releases/api/project-release-api', () => ({
  projectReleaseApi: {
    list: (request: { projectId: string }) => list(request),
  },
}));

import { projectReleaseQueries } from '@/features/project-releases/hooks/project-release-hooks';

const PROJECT_A = 'projectA';
const PROJECT_B = 'projectB';

describe('useProjectReleases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    list.mockReset();
    getProjectId.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('shows each project only its own releases when switching projects', async () => {
    let resolveProjectB: (page: ReturnType<typeof pageOf>) => void = () =>
      undefined;
    list.mockImplementation(({ projectId }: { projectId: string }) =>
      projectId === PROJECT_A
        ? Promise.resolve(pageOf(PROJECT_A))
        : new Promise((resolve) => {
            resolveProjectB = resolve;
          }),
    );

    getProjectId.mockReturnValue(PROJECT_A);
    const { result: resultProjectA, unmount: unmountProjectA } =
      renderReleases();
    await waitFor(() =>
      expect(resultProjectA.current.data).toEqual(pageOf(PROJECT_A)),
    );
    unmountProjectA();

    getProjectId.mockReturnValue(PROJECT_B);
    const { result: resultProjectB, unmount: unmountProjectB } =
      renderReleases();
    expect(resultProjectB.current.data).toBeUndefined();
    expect(resultProjectB.current.isLoading).toBe(true);

    resolveProjectB(pageOf(PROJECT_B));
    await waitFor(() =>
      expect(resultProjectB.current.data).toEqual(pageOf(PROJECT_B)),
    );
    unmountProjectB();

    getProjectId.mockReturnValue(PROJECT_A);
    const { result: resultBackToA } = renderReleases();
    expect(resultBackToA.current.data).toEqual(pageOf(PROJECT_A));
  });

  function renderReleases() {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => projectReleaseQueries.useProjectReleases(), {
      wrapper,
    });
  }
});

function pageOf(projectId: string) {
  return {
    data: [{ id: `release-of-${projectId}` }],
    next: null,
    previous: null,
  };
}
