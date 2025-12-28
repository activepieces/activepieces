import React, { useState } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <CardListItem
      className="h-[76px] w-full rounded-xl flex items-center gap-4 bg-transparent border border-transparent hover:bg-accent/50 hover:border-border transition-all duration-200 cursor-pointer group relative overflow-hidden p-1"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-shrink-0 h-full aspect-[1.4/1] rounded-lg overflow-hidden flex items-center justify-center border border-transparent group-hover:border-border transition-all duration-200">
        <PieceIcon
          logoUrl={stepMetadataWithSuggestions.logoUrl}
          displayName={stepMetadataWithSuggestions.displayName}
          showTooltip={false}
          playOnHover={true}
          forcePlay={isHovered}
        />
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="text-sm font-bold leading-tight text-foreground">
          {pieceSelectorItemInfo.displayName}
        </div>
        <div className="text-xs leading-snug text-muted-foreground line-clamp-2">
          {pieceSelectorItemInfo.description}
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-l from-muted via-muted/95 to-transparent backdrop-blur-[4px]" />
        <span className="relative text-sm font-bold text-foreground z-10">
          Add
        </span>
      </div>
    </CardListItem>
  );
};

AIActionItem.displayName = 'AIActionItem';
export default AIActionItem;
