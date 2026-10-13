/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectsPage from '@/app/routes/platform/projects';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({ isError: false }));

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'p', autoCreatePersonalProjects: false, plan: {} },
      setCurrentPlatform: vi.fn(),
    }),
  },
}));
vi.mock('@/api/platforms-api', () => ({ platformApi: { update: vi.fn() } }));
vi.mock('@/features/connections', () => ({
  globalConnectionsQueries: {
    useGlobalConnections: () => ({ data: { data: [] } }),
  },
}));
vi.mock(
  '@/features/projects/components/platform-admin-project-alert-subscription-bulk-actions',
  () => ({ PlatformAdminProjectAlertSubscriptionBulkActions: () => null }),
);
vi.mock('@/app/routes/platform/projects/columns', () => ({
  projectsTableColumns: () => [],
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: {
    getCurrentUserPlatformRole: () => 'ADMIN',
  },
}));
vi.mock('@/app/components/enterprise-gate', () => ({
  EnterpriseGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/features/projects', () => ({
  CreateProjectButton: () => null,
  EditProjectDialog: () => null,
  projectCollectionUtils: {
    useCurrentProject: () => ({ project: { id: 'current' } }),
    useAllPlatformProjects: () => ({ data: [] }),
    useLoadState: () => ({ isFetching: false, isError: state.isError }),
    refetchProjects: () => Promise.resolve(),
    setCurrentProject: vi.fn(),
  },
}));
vi.mock('@/app/components/admin', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/app/components/admin')
  >();
  return {
    ...actual,
    AdminDataTable: ({
      emptyStateTextTitle,
      emptyStateTextDescription,
      hidePagination,
    }: {
      emptyStateTextTitle: string;
      emptyStateTextDescription: string;
      hidePagination?: boolean;
    }) => (
      <div>
        <p>{emptyStateTextTitle}</p>
        <p>{emptyStateTextDescription}</p>
        {!hidePagination && <nav aria-label="pagination" />}
      </div>
    ),
  };
});

function renderPage(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <ProjectsPage />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  state.isError = false;
});

describe('Projects list states', () => {
  it('says nothing matches when a search is active', () => {
    renderPage('/platform/projects?type=TEAM&displayName=nope');
    expect(screen.queryByText('No projects match these filters')).not.toBe(
      null,
    );
    expect(screen.queryByText('Clear a filter to see more.')).not.toBe(null);
  });

  it('says nothing matches when a non-default type is filtered', () => {
    renderPage('/platform/projects?type=PERSONAL');
    expect(screen.queryByText('No projects match these filters')).not.toBe(
      null,
    );
  });

  it('keeps the first-run empty state under the default Team filter', () => {
    renderPage('/platform/projects?type=TEAM');
    expect(screen.queryByText('No projects found')).not.toBe(null);
  });

  it('hides pagination when the list fails to load', () => {
    state.isError = true;
    renderPage('/platform/projects');
    expect(screen.queryByRole('navigation', { name: 'pagination' })).toBe(null);
  });

  it('shows pagination when the list loads', () => {
    renderPage('/platform/projects');
    expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBe(
      null,
    );
  });
});
