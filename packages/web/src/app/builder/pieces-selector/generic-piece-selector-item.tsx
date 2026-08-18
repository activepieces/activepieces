import type { ActionClassification } from '@activepieces/pieces-framework';
import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
import { t } from 'i18next';

import { CardListItem } from '@/components/custom/card-list';
import { Badge } from '@/components/ui/badge';
import {
  PieceIcon,
  PieceSelectorItem,
  StepMetadataWithSuggestions,
  PIECE_SELECTOR_ELEMENTS_HEIGHTS,
} from '@/features/pieces';
import { cn } from '@/lib/utils';
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
      classification: item.actionOrTrigger.classification,
    };
  }
  return {
    displayName: item.displayName,
    description: item.description,
    classification: undefined,
  };
};

const GenericActionOrTriggerItem = ({
  item,
  hidePieceIconAndDescription,
  stepMetadataWithSuggestions,
  onClick,
}: GenericActionOrTriggerItemProps) => {
  // we add this style because we hide the piece icon when they are in a virtualized list
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
    <CardListItem className="p-2 w-full" onClick={onClick} style={style}>
      <div className="flex gap-3 items-center w-full min-w-0">
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
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className={cn('text-sm', {
                truncate: hidePieceIconAndDescription,
              })}
            >
              {pieceSelectorItemInfo.displayName}
            </div>
            {pieceSelectorItemInfo.classification && (
              <Badge
                variant={
                  CLASSIFICATION_BADGE[pieceSelectorItemInfo.classification]
                    .variant
                }
                className="shrink-0 px-1.5 py-0 text-[10px] font-normal"
              >
                {CLASSIFICATION_BADGE[
                  pieceSelectorItemInfo.classification
                ].label()}
              </Badge>
            )}
          </div>
          <div
            className={cn('text-xs text-muted-foreground', {
              truncate: hidePieceIconAndDescription,
            })}
          >
            {pieceSelectorItemInfo.description.endsWith('.')
              ? pieceSelectorItemInfo.description.slice(0, -1)
              : pieceSelectorItemInfo.description}
          </div>
        </div>
      </div>
    </CardListItem>
  );
};

GenericActionOrTriggerItem.displayName = 'GenericActionOrTriggerItem';
export default GenericActionOrTriggerItem;

const CLASSIFICATION_BADGE: Record<
  ActionClassification,
  { label: () => string; variant: 'accent' | 'destructive' }
> = {
  READ: { label: () => t('Read'), variant: 'accent' },
  SEARCH: { label: () => t('Search'), variant: 'accent' },
  WRITE: { label: () => t('Write'), variant: 'accent' },
  DESTRUCTIVE: { label: () => t('Destructive'), variant: 'destructive' },
};
