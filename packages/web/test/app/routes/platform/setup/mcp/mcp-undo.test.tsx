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
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
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
  },
}));
vi.mock('@/app/routes/platform/setup/mcp/platform-mcp-hooks', () => ({
  platformMcpHooks: {
    usePlatformMcpServer: () => ({
      data: { disabledTools: [] },
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
            tools: ['flows_write', 'flows_delete'],
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
});

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
