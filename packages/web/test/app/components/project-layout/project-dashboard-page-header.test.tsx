/**
 * @vitest-environment jsdom
 */
import { ProjectType } from '@activepieces/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectDashboardPageHeader } from '@/app/components/project-layout/project-dashboard-page-header';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { hidePageHeader: false } }),
}));
vi.mock('@/features/members', () => ({
  InviteUserDialog: () => null,
  projectMembersHooks: { useProjectMembers: () => ({ projectMembers: [] }) },
}));
vi.mock('@/features/projects', () => ({
  getProjectName: () => 'Northwind',
  projectCollectionUtils: {
    useCurrentProject: () => ({
      project: { id: 'p1', type: ProjectType.TEAM },
    }),
  },
}));
vi.mock('@/features/projects/components/ap-project-display', () => ({
  ApProjectDisplay: ({ title }: { title: string }) => <span>{title}</span>,
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => false }),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: false }) },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        plan: { projectRolesEnabled: false, embeddingEnabled: false },
      },
    }),
  },
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: null }) },
}));
vi.mock('@/app/components/project-settings', () => ({
  ProjectSettingsDialog: ({
    open,
    onClose,
    initialTab,
  }: {
    open: boolean;
    onClose: () => void;
    initialTab: string;
  }) =>
    open ? (
      <div role="dialog" aria-label={initialTab}>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

afterEach(() => {
  cleanup();
});

describe('ProjectDashboardPageHeader settings link', () => {
  it('opens settings on the tab named in the link', () => {
    renderAt('/projects/p1/automations?settings=members&folderId=f1');
    expect(screen.getByRole('dialog', { name: 'members' })).toBeTruthy();
  });

  it('drops the link from the address when settings close', () => {
    renderAt('/projects/p1/automations?settings=members&folderId=f1');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('search').textContent).toBe('?folderId=f1');
  });

  it('ignores an unknown tab', () => {
    renderAt('/projects/p1/automations?settings=billing');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProjectDashboardPageHeader />
      <Search />
    </MemoryRouter>
  );
}

function Search() {
  return <span data-testid="search">{useLocation().search}</span>;
}
