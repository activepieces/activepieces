import { isNil } from '@activepieces/core-utils';
import {
  AgentRunListItem,
  PersistedAgentPart,
  PersistedAgentPartType,
  PersistedAgentRole,
  PersistedToolCallStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CircleAlert, CircleCheck, Wrench, X } from 'lucide-react';

import { ApMarkdown } from '@/components/custom/markdown';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';

type RunDetailPanelProps = {
  runId: string | null;
  onClose: () => void;
};

export const RunDetailPanel = ({ runId, onClose }: RunDetailPanelProps) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: run, isLoading } = agentsQueries.useAgentRun({
    runId,
    projectId: project.id,
  });

  return (
    <aside className="flex h-full w-[520px] shrink-0 flex-col border-l border-border">
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border px-5">
        <span className="min-w-0 grow truncate text-sm font-semibold">
          {run?.title ?? t('Untitled run')}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('Close')}
          onClick={onClose}
        >
          <X size={16} />
        </Button>
      </div>
      {isLoading || isNil(run) ? (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <ScrollArea className="min-h-0 grow">
          <div className="flex flex-col gap-5 p-5">
            <RunSummary run={run} />
            {run.uiMessages?.map((message, messageIndex) => (
              <div key={messageIndex} className="flex flex-col gap-3">
                {message.role === PersistedAgentRole.USER ? (
                  <PromptBlock parts={message.parts} />
                ) : (
                  message.parts.map((part, partIndex) => (
                    <PartBlock key={partIndex} part={part} />
                  ))
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </aside>
  );
};

const RunSummary = ({ run }: { run: AgentRunListItem }) => {
  const look = agentRunUtils.getStatusIcon(run.status);
  const durationMs = agentRunUtils.getDurationMs(run);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <StatusIconWithText
          icon={look.Icon}
          text={agentRunUtils.getStatusLabel(run.status)}
          variant={look.variant}
        />
        <span className="text-xs text-muted-foreground">
          {isNil(durationMs)
            ? '—'
            : formatUtils.formatDuration(durationMs, true)}
        </span>
        {!isNil(run.aiCredits) && (
          <span className="text-xs text-muted-foreground">
            {t('{credits} credits', { credits: run.aiCredits })}
          </span>
        )}
      </div>
      {!isNil(run.flow) && (
        <a
          href={authenticationSession.appendProjectRoutePrefix(
            `/runs/${run.flow.flowRunId}`,
          )}
          className="text-xs text-muted-foreground hover:underline"
        >
          {t('Triggered by {flow}', { flow: run.flow.displayName })}
        </a>
      )}
    </div>
  );
};

const PromptBlock = ({ parts }: { parts: PersistedAgentPart[] }) => {
  const text = parts
    .filter((part) => part.type === PersistedAgentPartType.TEXT)
    .map((part) => part.text)
    .join('\n');
  if (text.length === 0) {
    return null;
  }
  return (
    <div className="rounded-lg bg-accent p-3 text-sm">
      <ApMarkdown markdown={text} />
    </div>
  );
};

const PartBlock = ({ part }: { part: PersistedAgentPart }) => {
  if (part.type === PersistedAgentPartType.TEXT) {
    return (
      <div className="text-sm">
        <ApMarkdown markdown={part.text} />
      </div>
    );
  }
  if (part.type !== PersistedAgentPartType.TOOL_CALL) {
    return null;
  }
  const failed = part.status === PersistedToolCallStatus.ERROR;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Wrench size={14} className="text-muted-foreground" />
        <span className="min-w-0 truncate">{part.title ?? part.toolName}</span>
        {failed ? (
          <CircleAlert size={14} className="text-destructive" />
        ) : (
          <CircleCheck size={14} className="text-muted-foreground" />
        )}
      </div>
      {failed && !isNil(part.errorText) && (
        <p className="text-xs text-destructive">{part.errorText}</p>
      )}
    </div>
  );
};
