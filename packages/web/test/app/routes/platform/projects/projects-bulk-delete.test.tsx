/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import ProjectsPage from '@/app/routes/platform/projects';
import { TooltipProvider } from '@/components/ui/tooltip';

const store = vi.hoisted(() => ({
  projects: [] as { id: string; displayName: string }[],
  listeners: new Set<() => void>(),
  failDelete: (_error: unknown) => undefined as void,
}));

function setProjects(next: { id: string; displayName: string }[]) {
  store.projects = next;
  store.listeners.forEach((listener) => listener());
}

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
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
vi.mock('@/app/components/enterprise-gate', () => ({
  EnterpriseGate: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/features/projects', () => ({
  CreateProjectButton: () => null,
  EditProjectDialog: () => null,
  projectCollectionUtils: {
    useCurrentProject: () => ({ project: { id: 'current' } }),
    useAllPlatformProjects: () => ({
      data: React.useSyncExternalStore(
        (listener) => {
          store.listeners.add(listener);
          return () => store.listeners.delete(listener);
        },
        () => store.projects,
      ),
    }),
    useLoadState: () => ({ isFetching: false, isError: false }),
    delete: (ids: string[]) => {
      const before = store.projects;
      setProjects(before.filter((project) => !ids.includes(project.id)));
      return new Promise((_, reject) => {
        store.failDelete = (error: unknown) => {
          setProjects(before);
          reject(error);
        };
      });
    },
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
    AdminDataTable: SelectionSyncedTable,
  };
});

type FakeRow = {
  original: { id: string; displayName: string };
  toggleSelected: (value: boolean) => void;
};

function SelectionSyncedTable({
  columns,
  page,
  bulkActions,
}: {
  columns: { cell?: unknown }[];
  page: { data: { id: string; displayName: string }[] };
  bulkActions: { render: (rows: [], reset: () => void) => React.ReactNode }[];
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const stillShown = selected.filter((id) =>
    page.data.some((project) => project.id === id),
  );
  const cell = columns[0]?.cell;
  return (
    <div>
      {page.data.map((project) => {
        const row: FakeRow = {
          original: project,
          toggleSelected: (value) =>
            setSelected((current) =>
              value
                ? [...current, project.id]
                : current.filter((id) => id !== project.id),
            ),
        };
        return (
          <div key={project.id}>
            {typeof cell === 'function' ? cell({ row }) : null}
          </div>
        );
      })}
      {stillShown.length > 0 &&
        bulkActions.map((action, index) => (
          <div key={index}>{action.render([], () => setSelected([]))}</div>
        ))}
    </div>
  );
}

function serverError(message: string) {
  return new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 500,
    statusText: 'Server Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { params: { message } },
  });
}

describe('Projects bulk delete', () => {
  it('keeps the confirm open while the rows it is deleting leave the table', async () => {
    setProjects([
      { id: 'sales', displayName: 'Sales' },
      { id: 'ops', displayName: 'Ops' },
    ]);
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { mutations: { retry: false } } })
        }
      >
        <MemoryRouter>
          <TooltipProvider>
            <ProjectsPage />
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Sales' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete (1)' }));
    fireEvent.change(screen.getByLabelText('To confirm, type Sales'), {
      target: { value: 'Sales' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Delete (1)' })).toBeNull(),
    );
    expect(screen.getByRole('dialog', { name: 'Delete Sales?' })).toBeTruthy();

    await act(async () => store.failDelete(serverError('Database is busy')));

    const confirm = screen.getByRole('dialog', { name: 'Delete Sales?' });
    await waitFor(() =>
      expect(within(confirm).getAllByText('Database is busy')).toHaveLength(1),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });
});
