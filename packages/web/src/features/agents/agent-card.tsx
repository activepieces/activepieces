import {
  AgentSummary,
  AgentVisibility,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';
import { t } from 'i18next';

import { AgentMark } from './agent-mark';
import { AgentToolStack } from './agent-tool-stack';

type AgentCardProps = {
  agent: AgentSummary;
  projectDotColor?: string;
  onClick: () => void;
};

const PRIVATE_DOT_COLOR = '#A3A3A3';

const AgentChip = ({
  label,
  dotColor,
}: {
  label: string;
  dotColor?: string;
}) => (
  <span className="flex items-center gap-[6px] rounded-full border border-border px-[9px] py-[3px] text-xs leading-4">
    {dotColor && (
      <span
        className="size-[7px] shrink-0 rounded-[2px]"
        style={{ backgroundColor: dotColor }}
      />
    )}
    {label}
  </span>
);

export const AgentCard = ({
  agent,
  projectDotColor,
  onClick,
}: AgentCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full w-full flex-col justify-between gap-4 overflow-clip rounded-[19px] border border-border bg-background p-5 text-left shadow-[0_1px_2px_#0A0A0A0A,0_4px_12px_-2px_#0A0A0A14] transition-shadow hover:shadow-[0_2px_4px_#0A0A0A0F,0_12px_24px_-4px_#0A0A0A1F]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-[150px] w-[260px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          backgroundImage: `radial-gradient(ellipse 90% 90% at 100% 0% in oklab, color-mix(in oklab, ${
            PROJECT_COLOR_PALETTE[agent.color].color
          } 22%, transparent) 0%, transparent 70%)`,
        }}
      />
      <div className="relative flex items-center gap-[14px]">
        <AgentMark icon={agent.icon} color={agent.color} />
        <div className="flex min-w-0 grow basis-0 flex-col gap-[3px]">
          <span className="truncate text-base font-semibold leading-5">
            {agent.displayName}
          </span>
          <span className="line-clamp-2 text-[13px] leading-4 text-muted-foreground">
            {agent.description ?? t('No description yet')}
          </span>
        </div>
      </div>
      <div className="relative flex items-center gap-[10px]">
        <AgentToolStack
          toolCount={agent.toolCount}
          toolPieceNames={agent.toolPieceNames}
        />
        <div className="ms-auto">
          {agent.visibility === AgentVisibility.RESTRICTED ||
          agent.projectIsPrivate ? (
            <AgentChip label={t('Private')} dotColor={PRIVATE_DOT_COLOR} />
          ) : (
            agent.projectDisplayName.length > 0 && (
              <AgentChip
                label={agent.projectDisplayName}
                dotColor={projectDotColor}
              />
            )
          )}
        </div>
      </div>
    </button>
  );
};
