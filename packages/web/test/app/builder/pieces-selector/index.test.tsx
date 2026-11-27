// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  FlowOperationType,
  FlowTriggerType,
  PieceSelectorConfig,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let openedSelectorId: string | null = null;
  let pieceSelectorConfig: PieceSelectorConfig | null = null;
  return {
    getPiece: vi.fn(),
    getOpenedSelectorId: () => openedSelectorId,
    setOpenedSelectorId: (next: string | null) => {
      openedSelectorId = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getPieceSelectorConfig: () => pieceSelectorConfig,
    setPieceSelectorConfig: (next: PieceSelectorConfig | null) => {
      pieceSelectorConfig = next;
    },
  };
});

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: { get: mocks.getPiece },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

vi.mock('@/features/platform-admin', () => ({
  aiProviderQueries: {
    useProjectAiProviders: () => ({ data: [{ provider: 'openai' }] }),
  },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { pieceSelectorConfig: mocks.getPieceSelectorConfig() },
    }),
  },
}));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: <T,>(selector: (state: unknown) => T) => {
    const openedSelectorId = React.useSyncExternalStore(
      mocks.subscribe,
      mocks.getOpenedSelectorId,
    );
    return selector({
      openedPieceSelectorStepNameOrAddButtonId: openedSelectorId,
      setOpenedPieceSelectorStepNameOrAddButtonId: mocks.setOpenedSelectorId,
      setSelectedPieceMetadataInPieceSelector: () => undefined,
      flowVersion: { trigger: { type: FlowTriggerType.PIECE } },
      deselectStep: () => undefined,
    });
  },
}));

vi.mock('@/app/builder/pieces-selector/explore-tab-content', () => ({
  ExploreTabContent: () => null,
}));

vi.mock('@/app/builder/pieces-selector/approvals-tab-content', () => ({
  ApprovalsTabContent: () => null,
}));

vi.mock('@/app/builder/pieces-selector/pieces-card-list', () => ({
  PiecesCardList: () => null,
}));

import { PieceSelector } from '@/app/builder/pieces-selector';
import { PieceSelectorOperation } from '@/features/pieces';

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('PieceSelector AI & Agents tab', () => {
  afterEach(() => {
    act(() => mocks.setOpenedSelectorId(null));
    mocks.setPieceSelectorConfig(null);
    mocks.getPiece.mockReset();
  });

  it('stays hidden while the AI piece is still loading', async () => {
    mocks.getPiece.mockReturnValue(new Promise(() => undefined));
    mountSelector();

    await openSelector();

    expect(screen.getByRole('tab', { name: 'Apps' })).toBeTruthy();
    expect(aiTab()).toBeNull();
  });

  it('stays hidden on every open when the AI piece is excluded by a piece set', async () => {
    const firstOpenRefetch = Promise.withResolvers<never>();
    mocks.getPiece
      .mockRejectedValueOnce(pieceNotFoundError())
      .mockReturnValueOnce(firstOpenRefetch.promise)
      .mockReturnValueOnce(new Promise(() => undefined));
    const queryClient = mountSelector();
    await waitFor(() => expect(aiPieceQueryStatus(queryClient)).toBe('error'));

    await openSelector();

    expect(mocks.getPiece).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('tab', { name: 'Apps' })).toBeTruthy();
    expect(aiTab()).toBeNull();

    firstOpenRefetch.reject(pieceNotFoundError());
    await waitFor(() => expect(aiPieceQueryStatus(queryClient)).toBe('error'));
    act(() => mocks.setOpenedSelectorId(null));
    await openSelector();

    expect(mocks.getPiece).toHaveBeenCalledTimes(3);
    expect(aiTab()).toBeNull();
  });

  it('stays hidden when the AI piece loads without actions', async () => {
    mocks.getPiece.mockResolvedValue({ ...aiPiece(), actions: {} });
    const queryClient = mountSelector();
    await waitFor(() =>
      expect(aiPieceQueryStatus(queryClient)).toBe('success'),
    );

    await openSelector();

    expect(screen.getByRole('tab', { name: 'Apps' })).toBeTruthy();
    expect(aiTab()).toBeNull();
  });

  it('shows once the AI piece loads with actions and stays on reopen', async () => {
    mocks.getPiece.mockResolvedValue(aiPiece());
    mountSelector();

    await openSelector();
    expect(
      await screen.findByRole('tab', { name: 'AI & Agents' }),
    ).toBeTruthy();

    act(() => mocks.setOpenedSelectorId(null));
    await openSelector();

    expect(aiTab()).toBeTruthy();
    expect(mocks.getPiece).toHaveBeenCalledTimes(1);
  });

  it('stays hidden when the platform hides it in the selector customization', async () => {
    mocks.setPieceSelectorConfig({
      tabs: [
        {
          id: 'AI_AND_AGENTS',
          kind: 'BUILTIN',
          builtinTab: 'AI_AND_AGENTS',
          hidden: true,
        },
      ],
    });
    mocks.getPiece.mockResolvedValue(aiPiece());
    const queryClient = mountSelector();
    await waitFor(() =>
      expect(aiPieceQueryStatus(queryClient)).toBe('success'),
    );

    await openSelector();

    expect(screen.getByRole('tab', { name: 'Apps' })).toBeTruthy();
    expect(aiTab()).toBeNull();
  });
});

const ADD_ACTION: PieceSelectorOperation = {
  type: FlowOperationType.ADD_ACTION,
  actionLocation: {
    parentStep: 'trigger',
    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
  },
};

function mountSelector(): QueryClient {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <PieceSelector id="add-step" operation={ADD_ACTION}>
        <button type="button">{'Add step'}</button>
      </PieceSelector>
    </QueryClientProvider>,
  );
  return queryClient;
}

async function openSelector() {
  fireEvent.click(screen.getByRole('button', { name: 'Add step' }));
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

function aiTab() {
  return screen.queryByRole('tab', { name: 'AI & Agents' });
}

function aiPieceQueryStatus(queryClient: QueryClient) {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ['piece', '@activepieces/piece-ai'] })[0]?.state
    .status;
}

function aiPiece() {
  return {
    name: '@activepieces/piece-ai',
    displayName: 'AI',
    actions: { askAi: { name: 'askAi', displayName: 'Ask AI' } },
    triggers: {},
  };
}

function pieceNotFoundError() {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Not Found', 'ERR_BAD_REQUEST', config, undefined, {
    data: { code: 'ENTITY_NOT_FOUND', params: {} },
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config,
  });
}
