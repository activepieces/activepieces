import { CardList, CardListItemSkeleton } from '@/components/custom/card-list';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/lib/piece-selector-tabs-provider';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import { PieceSelectorOperation } from '@/lib/types';
import { FlowActionType, FlowOperationType, isNil } from '@activepieces/shared';

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

  const isLoading = pieceQueries.some((query) => query.isLoading);
  const allPiecesLoaded = pieceQueries.every(
    (query) => query.isSuccess && !isNil(query.data),
  );

  if (
    selectedTab !== PieceSelectorTabType.APPROVALS ||
    ![FlowOperationType.ADD_ACTION, FlowOperationType.UPDATE_ACTION].includes(
      operation.type,
    )
  ) {
    return null;
  }

  if (isLoading || !allPiecesLoaded) {
    return (
      <div className="flex flex-col gap-2 w-full p-2">
        <CardListItemSkeleton numberOfCards={3} withCircle={false} />
      </div>
    );
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
