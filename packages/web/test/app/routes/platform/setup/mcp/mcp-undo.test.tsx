/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlatformMcpPage from '@/app/routes/platform/setup/mcp';

const state = vi.hoisted(() => ({
  serverTools: [] as string[],
  updateAsync: vi.fn(),
  onUndo: undefined as (() => Promise<unknown>) | undefined,
  nextTools: ['flows_write', 'flows_delete'],
  initialTools: [] as string[],
  previous: undefined as string[] | undefined,
  pending: false,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
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
      undo: ({ onUndo }: { onUndo: () => Promise<unknown> }) => {
        state.onUndo = onUndo;
      },
    },
  };
});
vi.mock('@/app/routes/platform/setup/mcp/platform-mcp-api', () => ({
  platformMcpApi: {
    get: () => Promise.resolve({ disabledTools: state.serverTools }),
    update: (...args: unknown[]) => state.updateAsync(...args),
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
    useUpdatePlatformMcpTools: () => ({ mutateAsync: () => Promise.resolve() }),
  },
}));
vi.mock(
  '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list',
  () => ({
    McpToolTierList: ({
      onUpdateDisabledTools,
    }: {
      onUpdateDisabledTools: (change: Record<string, unknown>) => void;
    }) => (
      <button
        type="button"
        onClick={() =>
          onUpdateDisabledTools({
            tools: state.nextTools,
            lastSaved: () => state.previous ?? state.initialTools,
            hasPendingChange: () => state.pending,
            onSaved: () => undefined,
            onSettled: () => undefined,
          })
        }
      >
        Turn off flow writes
      </button>
    ),
  }),
);

beforeEach(() => {
  state.updateAsync = vi.fn().mockResolvedValue(undefined);
  state.onUndo = undefined;
  state.nextTools = ['flows_write', 'flows_delete'];
  state.initialTools = [];
  state.previous = undefined;
  state.pending = false;
});

async function turnOffTools() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PlatformMcpPage section="access" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Turn off flow writes' }));
  await waitFor(() => expect(state.onUndo).toBeDefined());
}

const WAIT_MESSAGE = 'Wait for the current change to finish, then undo.';

describe('Platform MCP undo', () => {
  it.each([
    {
      bug: 'undo turns back on tools another admin turned off since',
      previous: undefined,
      nextTools: ['flows_write', 'flows_delete'],
      serverTools: ['flows_write', 'flows_delete', 'tables_write'],
      expected: ['tables_write'],
    },
    {
      bug: 'undo reverts a first change that is still saving',
      previous: ['ap_create_flow'],
      nextTools: ['ap_create_flow', 'ap_delete_flow'],
      serverTools: ['ap_create_flow', 'ap_delete_flow'],
      expected: ['ap_create_flow'],
    },
  ])('$bug', async ({ previous, nextTools, serverTools, expected }) => {
    state.previous = previous;
    state.nextTools = nextTools;
    await turnOffTools();
    state.serverTools = serverTools;
    await state.onUndo?.();
    expect(state.updateAsync).toHaveBeenCalledWith({ disabledTools: expected });
  });

  it('refuses Undo while another tool change waits to be saved', async () => {
    await turnOffTools();
    state.pending = true;
    await expect(state.onUndo?.()).rejects.toThrow(WAIT_MESSAGE);
    expect(state.updateAsync).not.toHaveBeenCalled();
  });
});
