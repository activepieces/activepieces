import { t } from 'i18next';
import { Unplug } from 'lucide-react';

import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

const MAX_VISIBLE = 3;

type AgentToolStackProps = {
  toolCount: number;
  toolPieceNames: string[];
};

export const AgentToolStack = ({
  toolCount,
  toolPieceNames,
}: AgentToolStackProps) => {
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: toolPieceNames,
  });

  if (toolCount === 0) {
    return (
      <span className="flex items-center gap-1.5 text-[13px] leading-5 text-muted-foreground">
        <Unplug size={14} className="text-neutral-400" />
        {t('No tools')}
      </span>
    );
  }

  const visible = summaries.slice(0, MAX_VISIBLE);
  const remaining = toolCount - visible.length;

  return (
    <div className="flex shrink-0 items-center gap-[5px]">
      {visible.map((metadata) => (
        <PieceIcon
          key={metadata.name}
          logoUrl={metadata.logoUrl}
          displayName={metadata.displayName}
          showTooltip={true}
          size="tile"
          border={true}
        />
      ))}
      {remaining > 0 && (
        <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-[#F0F0F2] text-xs leading-none font-semibold text-[#8A8A8F]">
          +{remaining}
        </span>
      )}
    </div>
  );
};
