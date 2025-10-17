import { CardListItem } from '@/components/custom/card-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { PIECE_SELECTOR_ELEMENTS_HEIGHTS } from '@/features/pieces/lib/piece-selector-utils';
import { PieceSelectorItem, StepMetadataWithSuggestions } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
type GenericActionOrTriggerItemProps = {
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

const GenericActionOrTriggerItem = ({
  item,
  hidePieceIconAndDescription,
  stepMetadataWithSuggestions,
  onClick,
}: GenericActionOrTriggerItemProps) => {
  // we add this style because we hide the piece icon and description when they are in a virtualized list
  const style = hidePieceIconAndDescription
    ? {
        height: `${PIECE_SELECTOR_ELEMENTS_HEIGHTS.ACTION_OR_TRIGGER_ITEM_HEIGHT}px`,
        maxHeight: `${PIECE_SELECTOR_ELEMENTS_HEIGHTS.ACTION_OR_TRIGGER_ITEM_HEIGHT}px`,
      }
    : {
        minHeight: '54px',
      };
  const pieceSelectorItemInfo = getPieceSelectorItemInfo(item);
  return (
    <CardListItem
      className={cn('p-2 w-full ', {
        truncate: hidePieceIconAndDescription,
      })}
      onClick={onClick}
      style={style}
    >
      <div className="flex gap-3 items-center">
        <div
          className={cn({
            'opacity-0': hidePieceIconAndDescription,
          })}
        >
          <PieceIcon
            logoUrl={stepMetadataWithSuggestions.logoUrl}
            displayName={stepMetadataWithSuggestions.displayName}
            showTooltip={false}
            size={'sm'}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-sm">{pieceSelectorItemInfo.displayName}</div>
          {!hidePieceIconAndDescription && (
            <div className="text-xs text-muted-foreground">
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

GenericActionOrTriggerItem.displayName = 'GenericActionOrTriggerItem';
export default GenericActionOrTriggerItem;
