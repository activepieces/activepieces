import {
  AgentSummary,
  AgentVisibility,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Lock } from 'lucide-react';

import { AgentActionsMenu } from './agent-actions-menu';
import { AgentMark } from './agent-mark';
import { AgentToolStack } from './agent-tool-stack';

type AgentCardProps = {
  agent: AgentSummary;
  projectDotColor?: string;
  onClick: () => void;
};

const PRIVATE_DOT_COLOR = 'var(--gray-11)';

const AgentChip = ({
  label,
  dotColor,
}: {
  label: string;
  dotColor?: string;
}) => (
  <span className="flex h-6 min-w-0 items-center gap-1.5 rounded-md border border-gray-6 px-2 text-xs">
    {dotColor && (
      <span
        className="size-2 shrink-0 rounded-full"
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
    <div className="group relative h-full">
      <button
        type="button"
        onClick={onClick}
        className="relative flex h-full w-full flex-col justify-between gap-4 overflow-clip rounded-2xl bg-panel p-4 text-left shadow-edge transition-colors hover:bg-gray-2"
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
        <div className="relative flex items-start gap-3">
          <AgentMark icon={agent.icon} color={agent.color} />
          <div className="flex min-w-0 grow basis-0 flex-col gap-1 pe-8">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {agent.displayName}
              </span>
              {agent.visibility === AgentVisibility.RESTRICTED && (
                <Lock
                  className="size-3.5 shrink-0 text-gray-11"
                  aria-label={t('Only you and the people you shared it with')}
                />
              )}
            </span>
            <span className="line-clamp-2 text-xs text-gray-11">
              {agent.description ?? t('No description yet')}
            </span>
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <AgentToolStack
            toolCount={agent.toolCount}
            toolPieceNames={agent.toolPieceNames}
          />
          <div className="ms-auto">
            {(agent.projectIsPrivate ||
              agent.projectDisplayName.length > 0) && (
              <AgentChip
                label={
                  agent.projectIsPrivate
                    ? t('Personal Project')
                    : agent.projectDisplayName
                }
                dotColor={
                  agent.projectIsPrivate ? PRIVATE_DOT_COLOR : projectDotColor
                }
              />
            )}
          </div>
        </div>
      </button>
      <div className="absolute end-3 top-3 z-10">
        <AgentActionsMenu agent={agent} />
      </div>
    </div>
  );
};
