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
  stepMetadataWithSuggestions,
  onClick,
}: AIActionItemProps) => {
  const pieceSelectorItemInfo = getPieceSelectorItemInfo(item);

  return (
    <CardListItem
      className="p-3.5 w-full rounded-xl flex items-start gap-3 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-rose-50/70 dark:from-amber-950/30 dark:via-orange-950/25 dark:to-rose-950/30 border border-amber-100/60 dark:border-amber-800/40 hover:border-amber-200 dark:hover:border-amber-700/50 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100/90 via-orange-100/80 to-rose-100/90 dark:from-amber-900/50 dark:via-orange-900/45 dark:to-rose-900/50 flex items-center justify-center p-2.5 shadow-sm">
        <PieceIcon
          logoUrl={stepMetadataWithSuggestions.logoUrl}
          displayName={stepMetadataWithSuggestions.displayName}
          showTooltip={false}
          size={'md'}
        />
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0 pt-0.5">
        <div className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-50">
          {pieceSelectorItemInfo.displayName}
        </div>
        <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2">
          {pieceSelectorItemInfo.description}
        </div>
      </div>
    </CardListItem>
  );
};

AIActionItem.displayName = 'AIActionItem';
export default AIActionItem;
