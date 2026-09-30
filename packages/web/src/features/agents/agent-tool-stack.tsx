import { unique } from '@activepieces/core-utils';
import { AgentToolType } from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, LucideIcon, Server, Unplug, Workflow } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

const MAX_VISIBLE = 3;

type AgentToolStackProps = {
  toolCount: number;
  toolPieceNames: string[];
  toolTypes?: AgentToolType[];
};

export const AgentToolStack = ({
  toolCount,
  toolPieceNames,
  toolTypes = [],
}: AgentToolStackProps) => {
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: unique(toolPieceNames),
  });

  if (toolCount === 0) {
    return (
      <span className="flex items-center gap-1.5 text-[13px] leading-5 text-muted-foreground">
        <Unplug size={14} className="text-neutral-400" />
        {t('No tools')}
      </span>
    );
  }

  const tiles = [
    ...summaries.map((metadata) => ({
      tools: toolPieceNames.filter((name) => name === metadata.name).length,
      element: (
        <PieceIcon
          key={metadata.name}
          logoUrl={metadata.logoUrl}
          displayName={metadata.displayName}
          showTooltip={true}
          size="tile"
          border={true}
        />
      ),
    })),
    ...NON_PIECE_TOOL_KINDS.flatMap(({ type, icon: Icon, label }) => {
      const count = toolTypes.filter((toolType) => toolType === type).length;
      if (count === 0) {
        return [];
      }
      return [
        {
          tools: count,
          element: (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <span className="flex size-6.5 items-center justify-center rounded-md border bg-background text-muted-foreground">
                  <Icon size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {count > 1 ? `${t(label)} · ${count}` : t(label)}
              </TooltipContent>
            </Tooltip>
          ),
        },
      ];
    }),
  ];
  const visible = tiles.slice(0, MAX_VISIBLE);
  const remaining =
    toolCount - visible.reduce((shown, tile) => shown + tile.tools, 0);

  return (
    <div className="flex shrink-0 items-center gap-[5px]">
      {visible.map((tile) => tile.element)}
      {remaining > 0 && (
        <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-[#F0F0F2] text-xs leading-none font-semibold text-[#8A8A8F]">
          +{remaining}
        </span>
      )}
    </div>
  );
};

const NON_PIECE_TOOL_KINDS: {
  type: AgentToolType;
  icon: LucideIcon;
  label: string;
}[] = [
  {
    type: AgentToolType.KNOWLEDGE_BASE,
    icon: BookOpen,
    label: 'Knowledge Base',
  },
  { type: AgentToolType.FLOW, icon: Workflow, label: 'Flows' },
  { type: AgentToolType.MCP, icon: Server, label: 'MCP Servers' },
];
