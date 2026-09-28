import { UnplugIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
      <span className="flex items-center gap-1.5 text-[13px] leading-5 text-gray-11">
        <HugeiconsIcon icon={UnplugIcon} size={14} className="text-gray-11" />
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
          size="xs"
          border={true}
        />
      ))}
      {remaining > 0 && (
        <span className="flex size-6.25 items-center justify-center rounded-[7px] bg-gray-3 text-xs leading-none font-semibold text-gray-11">
          +{remaining}
        </span>
      )}
    </div>
  );
};
