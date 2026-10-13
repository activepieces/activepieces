/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlatformMcpPage from '@/app/routes/platform/setup/mcp';

const state = vi.hoisted(() => ({
  serverTools: [] as string[],
  updateAsync: vi.fn(),
  onUndo: undefined as (() => Promise<unknown>) | undefined,
  message: undefined as string | undefined,
  nextTools: ['flows_write', 'flows_delete'],
  initialTools: [] as string[],
}));

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) => values?.[name] ?? ''),
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { projectRolesEnabled: false } },
    }),
  },
}));
vi.mock('@/lib/mutation-feedback', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/lib/mutation-feedback')
  >();
  return {
    ...actual,
    mutationFeedback: {
      ...actual.mutationFeedback,
      undo: ({
        message,
        onUndo,
      }: {
        message: string;
        onUndo: () => Promise<unknown>;
      }) => {
        state.message = message;
        state.onUndo = onUndo;
      },
    },
  };
});
vi.mock('@/app/routes/platform/setup/mcp/platform-mcp-api', () => ({
  platformMcpApi: {
    get: () => Promise.resolve({ disabledTools: state.serverTools }),
  },
}));
vi.mock('@/app/routes/platform/setup/mcp/platform-mcp-hooks', () => ({
  platformMcpHooks: {
    usePlatformMcpServer: () => ({
      data: { disabledTools: state.initialTools },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useUpdatePlatformMcpTools: () => ({
      mutate: (_: unknown, options: { onSuccess: () => void }) =>
        options.onSuccess(),
      mutateAsync: state.updateAsync,
    }),
  },
}));
vi.mock(
  '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list',
  () => ({
    McpToolTierList: ({
      onUpdateDisabledTools,
    }: {
      onUpdateDisabledTools: (change: {
        tools: string[];
        onSettled: () => void;
      }) => void;
    }) => (
      <button
        type="button"
        onClick={() =>
          onUpdateDisabledTools({
            tools: state.nextTools,
            onSettled: () => undefined,
          })
        }
      >
        Turn off flow writes
      </button>
    ),
  }),
);
vi.mock('@/app/routes/mcp-server/activity/activity-feed', () => ({
  ActivityFeed: () => null,
}));

beforeEach(() => {
  state.updateAsync = vi.fn().mockResolvedValue(undefined);
  state.onUndo = undefined;
  state.message = undefined;
  state.nextTools = ['flows_write', 'flows_delete'];
  state.initialTools = [];
});

function renderAccessPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PlatformMcpPage section="access" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Turn off flow writes' }));
}

describe('Platform MCP undo', () => {
  it('turns back on only the tools that action turned off', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PlatformMcpPage section="access" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Turn off flow writes' }),
    );
    await waitFor(() => expect(state.onUndo).toBeDefined());

    state.serverTools = ['flows_write', 'flows_delete', 'tables_write'];
    await state.onUndo?.();

    expect(state.updateAsync).toHaveBeenCalledWith({
      disabledTools: ['tables_write'],
    });
  });

  it('refuses a second Undo while the first is still running', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PlatformMcpPage section="access" />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Turn off flow writes' }),
    );
    await waitFor(() => expect(state.onUndo).toBeDefined());

    const first = state.onUndo?.();
    await expect(state.onUndo?.()).rejects.toThrow(
      'Wait for the current change to finish, then undo.',
    );
    await first;

    expect(state.updateAsync).toHaveBeenCalledTimes(1);
  });
});

describe('Platform MCP saved toast', () => {
  it('names the tool group that was turned off', async () => {
    renderAccessPage();
    await waitFor(() =>
      expect(state.message).toBe('Publish and run turned off'),
    );
  });

  it('names a single tool that was turned on', async () => {
    state.initialTools = ['ap_delete_flow'];
    state.nextTools = [];
    renderAccessPage();
    await waitFor(() => expect(state.message).toBe('Delete flow turned on'));
  });

  it('falls back to a generic message for mixed changes', async () => {
    state.initialTools = ['ap_delete_flow'];
    state.nextTools = ['ap_create_flow'];
    renderAccessPage();
    await waitFor(() => expect(state.message).toBe('Changes saved'));
  });
});
