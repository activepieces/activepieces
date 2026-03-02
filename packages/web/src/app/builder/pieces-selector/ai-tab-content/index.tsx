import { FlowOperationType, isNil } from '@activepieces/shared';

import { CardListItemSkeleton } from '@/components/custom/card-list';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/stores/piece-selector-tabs-provider';
import { PieceSelectorOperation } from '@/features/pieces/types';
import { stepUtils } from '@/features/pieces/utils/step-utils';

import { AIPieceActionsList } from './ai-actions-list';

const AITabContent = ({ operation }: { operation: PieceSelectorOperation }) => {
  const { selectedTab } = usePieceSelectorTabs();
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: '@activepieces/piece-ai',
  });

  if (
    selectedTab !== PieceSelectorTabType.AI_AND_AGENTS ||
    ![FlowOperationType.ADD_ACTION, FlowOperationType.UPDATE_ACTION].includes(
      operation.type,
    )
  ) {
    return null;
  }

  if (isLoading || isNil(pieceModel)) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <CardListItemSkeleton numberOfCards={2} withCircle={false} />
      </div>
    );
  }

  const metadata = stepUtils.mapPieceToMetadata({
    piece: pieceModel,
    type: 'action',
  });

  const pieceMetadataWithSuggestion = {
    ...metadata,
    suggestedActions: Object.values(pieceModel?.actions),
    suggestedTriggers: Object.values(pieceModel.triggers),
  };

  return (
    <div className="w-full">
      <AIPieceActionsList
        stepMetadataWithSuggestions={pieceMetadataWithSuggestion}
        hidePieceIconAndDescription={false}
        operation={operation}
      />
    </div>
  );
};

export { AITabContent };
