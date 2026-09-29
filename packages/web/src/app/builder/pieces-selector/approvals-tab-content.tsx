import { isNil } from '@activepieces/core-utils';
import { FlowActionType, FlowOperationType } from '@activepieces/shared';
import { t } from 'i18next';

import { CardList, CardListItemSkeleton } from '@/components/custom/card-list';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import {
  isPieceNotFoundError,
  piecesHooks,
  PieceSelectorTabType,
  usePieceSelectorTabs,
  PieceSelectorOperation,
  stepUtils,
} from '@/features/pieces';

import { useBuilderStateContext } from '../builder-hooks';

import GenericActionOrTriggerItem from './generic-piece-selector-item';

const APPROVAL_PIECES_CONFIG = [
  {
    pieceName: '@activepieces/piece-slack',
    approvalActionNames: [
      'request_approval_message',
      'request_approval_direct_message',
    ],
  },
  {
    pieceName: '@activepieces/piece-discord',
    approvalActionNames: ['request_approval_message'],
  },
  {
    pieceName: '@activepieces/piece-microsoft-teams',
    approvalActionNames: [
      'request_approval_direct_message',
      'request_approval_in_channel',
    ],
  },
  {
    pieceName: '@activepieces/piece-microsoft-outlook',
    approvalActionNames: ['request_approval_in_mail'],
  },
  {
    pieceName: '@activepieces/piece-gmail',
    approvalActionNames: ['request_approval_in_mail'],
  },
  {
    pieceName: '@activepieces/piece-telegram-bot',
    approvalActionNames: ['request_approval_message'],
  },
];

const ApprovalsTabContent = ({
  operation,
}: {
  operation: PieceSelectorOperation;
}) => {
  const { selectedTab } = usePieceSelectorTabs();
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);

  const pieceQueries = piecesHooks.useMultiplePieces({
    names: APPROVAL_PIECES_CONFIG.map((config) => config.pieceName),
  });

  if (
    selectedTab !== PieceSelectorTabType.APPROVALS ||
    ![FlowOperationType.ADD_ACTION, FlowOperationType.UPDATE_ACTION].includes(
      operation.type,
    )
  ) {
    return null;
  }

  const allApprovalActions = pieceQueries.flatMap((query) => {
    if (!query.data) return [];

    const config = APPROVAL_PIECES_CONFIG.find(
      (config) => config.pieceName === query.data.name,
    );
    if (isNil(config)) return [];
    const pieceMetadata = stepUtils.mapPieceToMetadata({
      piece: query.data,
      type: 'action',
    });

    return config.approvalActionNames
      .map((actionName) => {
        const action = query.data.actions[actionName];
        if (!action) return null;
        return {
          action,
          pieceMetadata,
        };
      })
      .filter((item) => !isNil(item));
  });

  if (allApprovalActions.length === 0) {
    if (pieceQueries.some((query) => query.isPending)) {
      return (
        <div className="flex flex-col gap-2 w-full p-2">
          <CardListItemSkeleton numberOfCards={3} withCircle={false} />
        </div>
      );
    }
    const failedQueries = pieceQueries.filter(
      (query) => query.isError && !isPieceNotFoundError(query.error),
    );
    if (failedQueries.length > 0) {
      return (
        <div className="w-full h-full overflow-y-auto">
          <DataFetchErrorState
            className="py-4 min-h-full"
            entity={t('approval actions')}
            onRetry={() =>
              Promise.all(failedQueries.map((query) => query.refetch()))
            }
          />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-sm text-muted-foreground">
          {t('No approval actions are available')}
        </p>
      </div>
    );
  }

  return (
    <CardList listClassName="gap-0">
      {allApprovalActions.map((item) => (
        <GenericActionOrTriggerItem
          key={`${item.pieceMetadata.pieceName}-${item.action.name}`}
          item={{
            actionOrTrigger: item.action,
            type: FlowActionType.PIECE,
            pieceMetadata: item.pieceMetadata,
          }}
          hidePieceIconAndDescription={false}
          stepMetadataWithSuggestions={{
            ...item.pieceMetadata,
            suggestedActions: [item.action],
            suggestedTriggers: [],
          }}
          onClick={() => {
            handleAddingOrUpdatingStep({
              pieceSelectorItem: {
                actionOrTrigger: item.action,
                type: FlowActionType.PIECE,
                pieceMetadata: item.pieceMetadata,
              },
              operation,
              selectStepAfter: true,
            });
          }}
        />
      ))}
    </CardList>
  );
};

export { ApprovalsTabContent };
