// @vitest-environment jsdom
import { FlowOperationType } from '@activepieces/shared';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));
vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: { useCurrentPlatform: () => ({ platform: { plan: {} } }) },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'test_project' },
}));
vi.mock('@/features/pieces/stores/piece-selector-tabs-provider', () => ({
  PieceSelectorTabType: {},
  usePieceSelectorTabs: () => ({ selectedTab: undefined }),
}));

const getPiece = vi.fn();
vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: { get: ({ name }: { name: string }) => getPiece(name) },
}));

vi.mock('@/features/pieces', async () => {
  const { piecesHooks, isPieceNotFoundError } = await vi.importActual<
    typeof import('@/features/pieces/hooks/pieces-hooks')
  >('@/features/pieces/hooks/pieces-hooks');
  return {
    piecesHooks,
    isPieceNotFoundError,
    PieceSelectorTabType: { APPROVALS: 'APPROVALS' },
    usePieceSelectorTabs: () => ({ selectedTab: 'APPROVALS' }),
    stepUtils: {
      mapPieceToMetadata: ({ piece }: { piece: { name: string } }) => ({
        pieceName: piece.name,
      }),
    },
  };
});

vi.mock('@/components/custom/card-list', () => ({
  CardList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardListItemSkeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: () => [vi.fn()],
}));

vi.mock('@/app/builder/pieces-selector/generic-piece-selector-item', () => ({
  default: ({
    item,
  }: {
    item: {
      pieceMetadata: { pieceName: string };
      actionOrTrigger: { name: string };
    };
  }) => (
    <div data-testid="approval-action">
      {`${item.pieceMetadata.pieceName}:${item.actionOrTrigger.name}`}
    </div>
  ),
}));

import { ApprovalsTabContent } from '@/app/builder/pieces-selector/approvals-tab-content';
import type { PieceSelectorOperation } from '@/features/pieces';

describe('ApprovalsTabContent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    getPiece.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retryDelay: 0 } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    onlineManager.setOnline(true);
  });

  it('lists the approval actions of the pieces that loaded when one lookup fails', async () => {
    getPiece.mockImplementation((name: string) =>
      name === SLACK
        ? Promise.reject(httpError(500))
        : Promise.resolve(pieceNamed(name)),
    );

    renderTab();

    await screen.findByText(`${DISCORD}:request_approval_message`);
    expect(renderedActions()).toEqual(
      ALL_APPROVAL_ACTIONS.filter((action) => !action.startsWith(SLACK)),
    );
    expect(screen.queryAllByTestId('skeleton')).toEqual([]);
  });

  it('shows a retryable error state instead of skeletons when every lookup fails', async () => {
    getPiece.mockRejectedValue(httpError(500));

    renderTab();

    const retryButton = await screen.findByRole('button', {
      name: 'Try again',
    });
    expect(screen.queryAllByTestId('skeleton')).toEqual([]);

    getPiece.mockImplementation((name: string) =>
      Promise.resolve(pieceNamed(name)),
    );
    fireEvent.click(retryButton);

    await screen.findByText(`${SLACK}:request_approval_message`);
    expect(renderedActions()).toEqual(ALL_APPROVAL_ACTIONS);
  });

  it('offers a retry for a failed lookup while another is still pending', async () => {
    getPiece.mockImplementation((name: string) =>
      name === SLACK
        ? Promise.reject(httpError(500))
        : new Promise(() => undefined),
    );

    renderTab();

    await screen.findByRole('button', { name: 'Try again' });
    expect(screen.queryAllByTestId('skeleton')).toEqual([]);
  });

  it('shows an empty state without a retry when no approval piece is installed', async () => {
    getPiece.mockRejectedValue(httpError(404));

    renderTab();

    await screen.findByText('No approval actions are available');
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryAllByTestId('skeleton')).toEqual([]);
  });

  it('lists the pieces that loaded while other lookups are still pending', async () => {
    getPiece.mockImplementation((name: string) =>
      name === SLACK
        ? Promise.resolve(pieceNamed(name))
        : new Promise(() => undefined),
    );

    renderTab();

    await screen.findByText(`${SLACK}:request_approval_message`);
    expect(renderedActions()).toEqual(
      ALL_APPROVAL_ACTIONS.filter((action) => action.startsWith(SLACK)),
    );
    expect(screen.queryAllByTestId('skeleton')).toEqual([]);
  });

  it('lists every approval action when all lookups succeed', async () => {
    getPiece.mockImplementation((name: string) =>
      Promise.resolve(pieceNamed(name)),
    );

    renderTab();

    await screen.findByText(`${SLACK}:request_approval_message`);
    expect(renderedActions()).toEqual(ALL_APPROVAL_ACTIONS);
  });

  it('shows skeletons while lookups are pending', () => {
    getPiece.mockReturnValue(new Promise(() => undefined));

    renderTab();

    expect(screen.getAllByTestId('skeleton')).toHaveLength(1);
  });

  it('keeps skeletons while lookups are paused offline', async () => {
    onlineManager.setOnline(false);
    getPiece.mockImplementation((name: string) =>
      Promise.resolve(pieceNamed(name)),
    );

    renderTab();

    expect(screen.getAllByTestId('skeleton')).toHaveLength(1);
    expect(getPiece).not.toHaveBeenCalled();
  });

  function renderTab() {
    return render(
      <QueryClientProvider client={queryClient}>
        <ApprovalsTabContent operation={OPERATION} />
      </QueryClientProvider>,
    );
  }
});

function renderedActions() {
  return screen
    .queryAllByTestId('approval-action')
    .map((element) => element.textContent);
}

function httpError(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', undefined, config, undefined, {
    data: {},
    status,
    statusText: '',
    headers: {},
    config,
  });
}

function pieceNamed(name: string) {
  const actionNames = [
    'request_approval_message',
    'request_approval_direct_message',
    'request_approval_in_channel',
    'request_approval_in_mail',
  ];
  return {
    name,
    actions: Object.fromEntries(
      actionNames.map((actionName) => [actionName, { name: actionName }]),
    ),
  };
}

const OPERATION: PieceSelectorOperation = {
  type: FlowOperationType.UPDATE_ACTION,
  stepName: 'step_1',
};
const SLACK = '@activepieces/piece-slack';
const DISCORD = '@activepieces/piece-discord';
const ALL_APPROVAL_ACTIONS = [
  `${SLACK}:request_approval_message`,
  `${SLACK}:request_approval_direct_message`,
  `${DISCORD}:request_approval_message`,
  '@activepieces/piece-microsoft-teams:request_approval_direct_message',
  '@activepieces/piece-microsoft-teams:request_approval_in_channel',
  '@activepieces/piece-microsoft-outlook:request_approval_in_mail',
  '@activepieces/piece-gmail:request_approval_in_mail',
  '@activepieces/piece-telegram-bot:request_approval_message',
];
