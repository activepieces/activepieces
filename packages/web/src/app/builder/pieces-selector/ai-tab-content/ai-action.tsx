import { FlowActionType, FlowTriggerType } from '@activepieces/shared';

import { CardListItem } from '@/components/custom/card-list';
import {
  PieceIcon,
  PieceSelectorItem,
  StepMetadataWithSuggestions,
} from '@/features/pieces';
import { cn } from '@/lib/utils';

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
  const description = pieceSelectorItemInfo.description?.endsWith('.')
    ? pieceSelectorItemInfo.description.slice(0, -1)
    : pieceSelectorItemInfo.description;

  return (
    <CardListItem
      className="group relative min-h-[132px] overflow-hidden rounded-xl border border-border/60 bg-background p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md"
      onClick={onClick}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 transition-transform group-hover:scale-105',
              {
                'opacity-0': hidePieceIconAndDescription,
              }
            )}
          >
            <PieceIcon
              logoUrl={stepMetadataWithSuggestions.logoUrl}
              displayName={stepMetadataWithSuggestions.displayName}
              showTooltip={false}
              size={'lg'}
            />
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            AI
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
            {pieceSelectorItemInfo.displayName}
          </div>
          <div
            className={cn(
              'line-clamp-2 text-xs leading-snug text-muted-foreground',
              {
                hidden: hidePieceIconAndDescription,
              }
            )}
          >
            {description}
          </div>
        </div>
      </div>
    </CardListItem>
  );
};

AIActionItem.displayName = 'AIActionItem';
export default AIActionItem;
