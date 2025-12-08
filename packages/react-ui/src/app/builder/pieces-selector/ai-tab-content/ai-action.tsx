import { CardListItem } from '@/components/custom/card-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { PieceSelectorItem, StepMetadataWithSuggestions } from '@/lib/types';
import { FlowActionType, FlowTriggerType } from '@activepieces/shared';

type AIActionItemProps = {
  item: PieceSelectorItem;
  hidePieceIconAndDescription: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions;
  onClick: () => void;
};

const getPieceSelectorItemInfo = (item: PieceSelectorItem) => {
  if (
    item.type === FlowActionType.PIECE ||
    item.type === FlowTriggerType.PIECE
  ) {
    return {
      displayName: item.actionOrTrigger.displayName,
      description: item.actionOrTrigger.description,
    };
  }
  return {
    displayName: item.displayName,
    description: item.description,
  };
};

const AIActionItem = ({
  item,
  hidePieceIconAndDescription,
  stepMetadataWithSuggestions,
  onClick,
}: AIActionItemProps) => {
  const pieceSelectorItemInfo = getPieceSelectorItemInfo(item);

  return (
    <CardListItem
      className="p-4 w-full h-full rounded-md flex flex-col justify-between"
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center">
          <PieceIcon
            logoUrl={stepMetadataWithSuggestions.logoUrl}
            displayName={stepMetadataWithSuggestions.displayName}
            showTooltip={false}
            size={'md'}
          />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <div className="text-sm font-medium leading-tight">
            {pieceSelectorItemInfo.displayName}
          </div>
          {!hidePieceIconAndDescription && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {pieceSelectorItemInfo.description.endsWith('.')
                ? pieceSelectorItemInfo.description.slice(0, -1)
                : pieceSelectorItemInfo.description}
            </div>
          )}
        </div>
      </div>
    </CardListItem>
  );
};

AIActionItem.displayName = 'AIActionItem';
export default AIActionItem;
