/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlatformMcpPage from '@/app/routes/platform/setup/mcp';

const state = vi.hoisted(() => ({
  serverTools: [] as string[],
  updateAsync: vi.fn(),
  onUndo: undefined as (() => Promise<unknown>) | undefined,
  message: undefined as string | undefined,
  nextTools: ['flows_write', 'flows_delete'],
  initialTools: [] as string[],
  get: undefined as (() => Promise<{ disabledTools: string[] }>) | undefined,
}));

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) => values?.[name] ?? ''),
}));
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
    get: () =>
      state.get?.() ?? Promise.resolve({ disabledTools: state.serverTools }),
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
    useUpdatePlatformMcpTools: () => ({
      mutate: (_: unknown, options: { onSuccess: () => void }) =>
        options.onSuccess(),
    }),
  },
}));
vi.mock(
  '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list',
  () => ({
    McpToolTierList: ({
      locked,
      onUpdateDisabledTools,
    }: {
      locked?: boolean;
      onUpdateDisabledTools: (change: {
        tools: string[];
        onSettled: () => void;
      }) => void;
    }) => (
      <button
        type="button"
        disabled={locked}
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
  state.get = undefined;
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

describe('Platform MCP undo locking', () => {
  it('locks the tool switches while Undo reads and saves', async () => {
    let answer: (server: { disabledTools: string[] }) => void = () => undefined;
    renderAccessPage();
    await waitFor(() => expect(state.onUndo).toBeDefined());
    state.get = () =>
      new Promise((resolve) => {
        answer = resolve;
      });

    let undone: Promise<unknown> | undefined;
    act(() => {
      undone = state.onUndo?.();
    });
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Turn off flow writes' })
          .hasAttribute('disabled'),
      ).toBe(true),
    );
    expect(state.updateAsync).not.toHaveBeenCalled();

    await act(async () => {
      answer({ disabledTools: ['flows_write', 'flows_delete'] });
      await undone;
    });
    expect(state.updateAsync).toHaveBeenCalledWith({ disabledTools: [] });
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Turn off flow writes' })
          .hasAttribute('disabled'),
      ).toBe(false),
    );
  });
});

describe('Platform MCP failed undo', () => {
  it('tells the admin when Undo could not read the tools', async () => {
    renderAccessPage();
    await waitFor(() => expect(state.onUndo).toBeDefined());
    state.get = () => Promise.reject(new Error('network down'));

    await expect(state.onUndo?.()).rejects.toThrow('network down');

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't undo",
        expect.anything(),
      ),
    );
    expect(state.updateAsync).not.toHaveBeenCalled();
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
