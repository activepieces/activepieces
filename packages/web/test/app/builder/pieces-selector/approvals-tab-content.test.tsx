// @vitest-environment jsdom
import { FlowOperationType } from '@activepieces/shared';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
  useQueries,
} from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const getPiece = vi.fn();

vi.mock('@/features/pieces', () => ({
  isPieceNotFoundError: (error: Error) => error.message === NOT_FOUND,
  PieceSelectorTabType: { APPROVALS: 'APPROVALS' },
  usePieceSelectorTabs: () => ({ selectedTab: 'APPROVALS' }),
  stepUtils: {
    mapPieceToMetadata: ({ piece }: { piece: { name: string } }) => ({
      pieceName: piece.name,
    }),
  },
  piecesHooks: {
    useMultiplePieces: ({ names }: { names: string[] }) =>
      useQueries({
        queries: names.map((name) => ({
          queryKey: ['piece', name],
          queryFn: () => getPiece(name),
        })),
      }),
  },
}));

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
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    onlineManager.setOnline(true);
  });

  it('lists the approval actions of the pieces that loaded when one lookup fails', async () => {
    getPiece.mockImplementation((name: string) =>
      name === SLACK
        ? Promise.reject(new Error('500'))
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
    getPiece.mockRejectedValue(new Error('500'));

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

  it('shows an empty state without a retry when no approval piece is installed', async () => {
    getPiece.mockRejectedValue(new Error(NOT_FOUND));

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
const NOT_FOUND = '404';
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
