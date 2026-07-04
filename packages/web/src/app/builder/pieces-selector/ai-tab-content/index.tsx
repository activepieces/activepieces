import { isNil } from '@activepieces/core-utils';
import { FlowOperationType } from '@activepieces/shared';
import { useTranslation } from 'react-i18next';

import { CardListItemSkeleton } from '@/components/custom/card-list';
import {
  piecesHooks,
  PieceSelectorTabType,
  usePieceSelectorTabs,
  PieceSelectorOperation,
  stepUtils,
} from '@/features/pieces';

import { AIPieceActionsList } from './ai-actions-list';

const AITabContent = ({ operation }: { operation: PieceSelectorOperation }) => {
  const { t } = useTranslation();
  const { selectedTab } = usePieceSelectorTabs();
  const { pieceModel, isLoading, isError } = piecesHooks.usePiece({
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <CardListItemSkeleton numberOfCards={2} withCircle={false} />
      </div>
    );
  }

  if (isError || isNil(pieceModel)) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-sm text-muted-foreground">
          {t('AI piece is not available for this platform')}
        </p>
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
