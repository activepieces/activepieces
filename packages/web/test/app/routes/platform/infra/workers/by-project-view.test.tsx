/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-enabled-disabled -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ByProjectView } from '@/app/routes/platform/infra/workers/by-project-view';

const state = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  }),
}));
vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => state.get(...args),
    post: (...args: unknown[]) => state.post(...args),
  },
}));
vi.mock('@/app/routes/platform/infra/workers/project-avatar', () => ({
  ProjectAvatar: () => null,
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

const PROJECT = {
  id: 'proj-1',
  displayName: 'Acme',
  workerGroupId: null,
  maxConcurrentJobs: null,
  analytics: { totalFlows: 3 },
};

function renderView(
  workerGroupsState: {
    isWorkerGroupsLoading: boolean;
    isWorkerGroupsError: boolean;
    onRetryWorkerGroups: () => unknown;
  } = {
    isWorkerGroupsLoading: false,
    isWorkerGroupsError: false,
    onRetryWorkerGroups: vi.fn(),
  },
) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ByProjectView
          workerGroups={[
            { label: 'group_a', slots: 5 },
            { label: 'group_b', slots: 5 },
          ]}
          sharedSlots={10}
          {...workerGroupsState}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function currentSelect() {
  const select = screen.getAllByRole<HTMLSelectElement>('combobox').find(
    (element) =>
      within(element).queryByRole('option', {
        name: 'group a',
        hidden: true,
      }) !== null,
  );
  if (!select) {
    throw new Error('worker group selector not rendered');
  }
  return select;
}

beforeEach(() => {
  state.get = vi
    .fn()
    .mockResolvedValue({ data: [PROJECT], next: null, previous: null });
  state.post = vi.fn();
});

describe('ByProjectView worker group selector', () => {
  it('is disabled while its save is pending', async () => {
    let resolveSave: (value: unknown) => void = () => undefined;
    state.post = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderView();
    const select = await waitFor(currentSelect);
    expect(select.disabled).toBe(false);

    fireEvent.change(currentSelect(), { target: { value: 'group_a' } });
    await waitFor(() =>
      expect(state.post).toHaveBeenCalledWith('/v1/projects/proj-1', {
        workerGroupId: 'group_a',
      }),
    );
    await waitFor(() => expect(currentSelect().disabled).toBe(true));

    resolveSave({ ...PROJECT, workerGroupId: 'group_a' });
    await waitFor(() => expect(currentSelect().disabled).toBe(false));
  });
});

describe('ByProjectView worker groups request', () => {
  it('shows no concurrency defaults while worker groups are loading', async () => {
    renderView({
      isWorkerGroupsLoading: true,
      isWorkerGroupsError: false,
      onRetryWorkerGroups: vi.fn(),
    });
    await waitFor(() => expect(state.get).toHaveBeenCalled());
    expect(screen.queryByPlaceholderText('Default {count}')).toBeNull();
    expect(screen.queryByText('Acme')).toBeNull();
  });

  it('shows the error state with a retry instead of concurrency defaults when worker groups fail', async () => {
    const onRetryWorkerGroups = vi.fn();
    renderView({
      isWorkerGroupsLoading: false,
      isWorkerGroupsError: true,
      onRetryWorkerGroups,
    });
    expect(screen.getByText('Trouble loading {entity}')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Default {count}')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(onRetryWorkerGroups).toHaveBeenCalledTimes(1));
  });

  it('shows concurrency defaults once worker groups have loaded', async () => {
    renderView();
    expect(await screen.findByPlaceholderText('Default {count}')).toBeTruthy();
  });
});
