import { CardListItem } from '@/components/custom/card-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { PIECE_SELECTOR_ELEMENTS_HEIGHTS } from '@/features/pieces/lib/piece-selector-utils';
import { PieceSelectorItem, StepMetadataWithSuggestions } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ActionType, TriggerType } from '@activepieces/shared';
type GenericActionOrTriggerItemProps = {
  item: PieceSelectorItem;
  hidePieceIconAndDescription: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions;
  onClick: () => void;
};

const getPieceSelectorItemInfo = (item: PieceSelectorItem) => {
  if (item.type === ActionType.PIECE || item.type === TriggerType.PIECE) {
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
    : {};
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
          <div className="text-sm">
            {getPieceSelectorItemInfo(item).displayName}
          </div>
          {!hidePieceIconAndDescription && (
            <div className="text-xs text-muted-foreground">
              {getPieceSelectorItemInfo(item).description}
            </div>
          )}
        </div>
      </div>
    </CardListItem>
  );
};

GenericActionOrTriggerItem.displayName = 'GenericActionOrTriggerItem';
export default GenericActionOrTriggerItem;
