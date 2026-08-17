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
        <Unplug size={12} />
        {t('No tools')}
      </span>
    );
  }

  const visible = summaries.slice(0, MAX_VISIBLE);
  const remaining = toolCount - visible.length;

  return (
    <div className="flex items-center gap-1">
      {visible.map((metadata) => (
        <PieceIcon
          key={metadata.name}
          logoUrl={metadata.logoUrl}
          displayName={metadata.displayName}
          showTooltip={true}
          size="sm"
          border={true}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining}</span>
      )}
    </div>
  );
};
