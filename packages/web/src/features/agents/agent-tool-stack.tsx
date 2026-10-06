import { unique } from '@activepieces/core-utils';
import { AgentToolType } from '@activepieces/shared';
import {
  BookOpen01Icon,
  ServerStack01Icon,
  UnplugIcon,
  WorkflowSquare02Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
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
      <span className="flex items-center gap-1.5 text-sm leading-5 text-gray-11">
        <HugeiconsIcon icon={UnplugIcon} size={14} className="text-gray-11" />
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
          size="xs"
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
                <span className="flex size-6.5 items-center justify-center rounded-md border bg-gray-1 text-gray-11">
                  <HugeiconsIcon icon={Icon} size={14} />
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
        <span className="flex size-6.25 items-center justify-center rounded-md bg-gray-3 text-xs leading-none font-semibold text-gray-11">
          +{remaining}
        </span>
      )}
    </div>
  );
};

const NON_PIECE_TOOL_KINDS: {
  type: AgentToolType;
  icon: IconSvgElement;
  label: string;
}[] = [
  {
    type: AgentToolType.KNOWLEDGE_BASE,
    icon: BookOpen01Icon,
    label: 'Knowledge Base',
  },
  { type: AgentToolType.FLOW, icon: WorkflowSquare02Icon, label: 'Flows' },
  { type: AgentToolType.MCP, icon: ServerStack01Icon, label: 'MCP Servers' },
];
