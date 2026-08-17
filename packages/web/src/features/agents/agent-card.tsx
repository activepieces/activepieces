import { AgentSummary, AgentVisibility } from '@activepieces/shared';
import { t } from 'i18next';
import { Lock } from 'lucide-react';

import { AgentMark } from './agent-mark';
import { AgentToolStack } from './agent-tool-stack';

type AgentCardProps = {
  agent: AgentSummary;
  projectName?: string;
  onClick: () => void;
};

export const AgentCard = ({ agent, projectName, onClick }: AgentCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-start gap-3">
        <AgentMark icon={agent.icon} color={agent.color} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-base font-semibold tracking-[-0.01em]">
            {agent.displayName}
          </span>
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {agent.description ?? t('No description yet')}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AgentToolStack
          toolCount={agent.toolCount}
          toolPieceNames={agent.toolPieceNames}
        />
        <div className="ms-auto">
          {agent.visibility === AgentVisibility.RESTRICTED ? (
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
              <Lock size={11} />
              {t('Private')}
            </span>
          ) : (
            projectName && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                {projectName}
              </span>
            )
          )}
        </div>
      </div>
    </button>
  );
};
