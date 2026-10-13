/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformModelTier } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TierCard } from '@/app/routes/platform/setup/ai/tiers-tab/tier-card';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({
  updateAsync: vi.fn(),
  undoAsync: vi.fn(),
  serverTiers: [] as PlatformModelTier[],
  listAdmin: undefined as (() => Promise<PlatformModelTier[]>) | undefined,
  onUndo: undefined as (() => Promise<unknown>) | undefined,
}));

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string | number>) =>
    Object.entries(vars ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/features/platform-admin/hooks/platform-model-tier-hooks', () => ({
  platformModelTierKeys: { admin: ['platform-model-tiers', 'admin'] },
  platformModelTierMutations: {
    useUpdate: ({ feedback }: { feedback: string }) => ({
      mutateAsync: (variables: unknown) =>
        feedback === 'silent'
          ? state.undoAsync(variables)
          : state.updateAsync(variables),
    }),
  },
}));
vi.mock('@/features/platform-admin/api/platform-model-tier-api', () => ({
  platformModelTierApi: {
    listAdmin: () => state.listAdmin?.() ?? Promise.resolve(state.serverTiers),
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
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => null,
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
  }: React.PropsWithChildren<{
    onSelect?: () => void;
    disabled?: boolean;
  }>) => (
    <div
      role="menuitem"
      aria-disabled={disabled === true}
      onClick={() => {
        if (disabled !== true) {
          onSelect?.();
        }
      }}
    >
      {children}
    </div>
  ),
}));
vi.mock('@/app/routes/platform/setup/ai/tiers-tab/admin-model-picker', () => ({
  AdminModelPicker: ({
    children,
    open,
    onOpenChange,
    onPick,
    mode,
  }: React.PropsWithChildren<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPick: (entry: { configId: string; modelId: string }) => void;
    mode: string;
  }>) => (
    <>
      <span onClick={() => onOpenChange(true)}>{children}</span>
      {open && (
        <button
          type="button"
          onClick={() => onPick({ configId: 'k1', modelId: 'opus' })}
        >
          {`Pick ${mode} model`}
        </button>
      )}
    </>
  ),
}));

const SONNET = { configId: 'k1', modelId: 'sonnet' };
const HAIKU = { configId: 'k1', modelId: 'haiku' };
const GEMINI = { configId: 'k1', modelId: 'gemini' };

function tier(entries: PlatformModelTier['entries']): PlatformModelTier {
  return {
    id: 'expert',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    platformId: 'p',
    name: 'Expert',
    emoji: '⚡',
    description: null,
    position: 0,
    entries,
    isDefault: false,
    isFast: false,
    thinkingBudget: null,
    deleted: null,
    replacedBy: null,
  };
}

function renderCard(queryClient: QueryClient) {
  render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TierCard
          tier={tier([SONNET, HAIKU])}
          configsById={new Map()}
          ownKeys={[]}
          keyModels={{}}
          projectIds={[]}
          previewProjectId={null}
          reducedMotion
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onMoveUp={vi.fn()}
          onMoveDown={vi.fn()}
        />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

function startPendingWrite(queryClient: QueryClient) {
  queryClient
    .getMutationCache()
    .build(queryClient, {
      mutationKey: ['platform-model-tiers', 'admin'],
      mutationFn: () => new Promise(() => undefined),
    })
    .execute({ id: 'expert', request: { entries: [] } })
    .catch(() => undefined);
}

function menuItem(name: string) {
  return screen
    .getAllByRole('menuitem')
    .find((item) => item.textContent === name);
}

beforeEach(() => {
  state.updateAsync = vi.fn().mockResolvedValue(tier([SONNET]));
  state.undoAsync = vi.fn().mockResolvedValue(tier([SONNET, HAIKU]));
  state.serverTiers = [];
  state.listAdmin = undefined;
  state.onUndo = undefined;
});

describe('TierCard while the tier has a pending write', () => {
  it('blocks the tier menu, the model menus and an open picker', async () => {
    const queryClient = new QueryClient();
    renderCard(queryClient);
    fireEvent.click(screen.getByRole('button', { name: 'Add fallback' }));
    expect(
      screen.getByRole('button', { name: 'Pick fallback model' }),
    ).toBeDefined();

    act(() => startPendingWrite(queryClient));

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Pick fallback model' }),
      ).toBeNull(),
    );
    for (const name of [
      'Edit',
      'Make default',
      'Use as fast model',
      'Move up',
      'Move down',
      'Delete',
    ]) {
      expect(menuItem(name)?.getAttribute('aria-disabled')).toBe('true');
    }
    for (const trigger of screen.getAllByRole('button', {
      name: 'Model actions',
    })) {
      expect(trigger.hasAttribute('disabled')).toBe(true);
    }
    expect(state.updateAsync).not.toHaveBeenCalled();
  });

  it('keeps a picker closed once the pending write finishes', async () => {
    const queryClient = new QueryClient();
    let finish: () => void = () => undefined;
    renderCard(queryClient);
    fireEvent.click(screen.getByRole('button', { name: 'Add fallback' }));

    act(() => {
      queryClient
        .getMutationCache()
        .build(queryClient, {
          mutationKey: ['platform-model-tiers', 'admin'],
          mutationFn: () =>
            new Promise<void>((resolve) => {
              finish = resolve;
            }),
        })
        .execute({ id: 'expert', request: { entries: [] } })
        .catch(() => undefined);
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Pick fallback model' }),
      ).toBeNull(),
    );
    await act(async () => finish());

    await waitFor(() =>
      expect(
        screen
          .getAllByRole('button', { name: 'Model actions' })[0]
          .hasAttribute('disabled'),
      ).toBe(false),
    );
    expect(
      screen.queryByRole('button', { name: 'Pick fallback model' }),
    ).toBeNull();
  });

  it('refuses Undo until the pending write finishes', async () => {
    const queryClient = new QueryClient();
    renderCard(queryClient);
    fireEvent.click(menuItem('Remove') ?? document.body);
    await waitFor(() => expect(state.onUndo).toBeDefined());

    act(() => startPendingWrite(queryClient));

    await expect(state.onUndo?.()).rejects.toThrow(
      'Wait for the current change to finish, then undo.',
    );
    expect(state.undoAsync).not.toHaveBeenCalled();
  });
});

describe('TierCard Undo', () => {
  it('refuses a second Undo while the first is still running', async () => {
    const queryClient = new QueryClient();
    renderCard(queryClient);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));
    await waitFor(() => expect(state.onUndo).toBeDefined());
    state.serverTiers = [tier([SONNET])];

    const first = state.onUndo?.();
    await expect(state.onUndo?.()).rejects.toThrow(
      'Wait for the current change to finish, then undo.',
    );
    await first;

    expect(state.undoAsync).toHaveBeenCalledTimes(1);
  });

  it('blocks edits while Undo reads the tier and until it saves', async () => {
    const queryClient = new QueryClient();
    let answer: (tiers: PlatformModelTier[]) => void = () => undefined;
    renderCard(queryClient);
    fireEvent.click(menuItem('Remove') ?? document.body);
    await waitFor(() => expect(state.onUndo).toBeDefined());
    state.listAdmin = () =>
      new Promise((resolve) => {
        answer = resolve;
      });

    let undone: Promise<unknown> | undefined;
    act(() => {
      undone = state.onUndo?.();
    });

    await waitFor(() => {
      for (const trigger of screen.getAllByRole('button', {
        name: 'Model actions',
      })) {
        expect(trigger.hasAttribute('disabled')).toBe(true);
      }
    });
    expect(menuItem('Delete')?.getAttribute('aria-disabled')).toBe('true');

    await act(async () => {
      answer([tier([SONNET])]);
      await undone;
    });
    expect(state.undoAsync).toHaveBeenCalledWith({
      id: 'expert',
      request: { entries: [SONNET, HAIKU] },
    });
  });

  it('puts the removed model back into the tier as the server has it now', async () => {
    const queryClient = new QueryClient();
    renderCard(queryClient);
    fireEvent.click(menuItem('Remove') ?? document.body);
    await waitFor(() => expect(state.onUndo).toBeDefined());

    state.serverTiers = [tier([SONNET, GEMINI])];
    await state.onUndo?.();

    expect(state.undoAsync).toHaveBeenCalledWith({
      id: 'expert',
      request: { entries: [SONNET, HAIKU, GEMINI] },
    });
  });
});
