import { isNil } from '@activepieces/core-utils';
import {
  AgentRunListItem,
  ContentBlockType,
  PersistedAgentPart,
  PersistedAgentPartType,
  PersistedAgentRole,
  PersistedToolCallStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowUpRight,
  Brain,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Paperclip,
} from 'lucide-react';
import { useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { JsonViewer } from '@/components/custom/json-viewer';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MarkdownBlock,
  PromptBlock,
  TimelineItem,
} from '@/features/agents/agent-timeline/timeline-blocks';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type RunDetailPanelProps = {
  runId: string | null;
  onClose: () => void;
};

export const RunDetailPanel = ({ runId, onClose }: RunDetailPanelProps) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const {
    data: run,
    isLoading,
    isError,
    refetch,
  } = agentsQueries.useAgentRun({
    runId,
    projectId: project.id,
  });

  return (
    <Sheet open={!isNil(runId)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[640px]">
        <SheetHeader className="shrink-0 gap-2 border-b border-border px-6 py-4">
          <SheetTitle className="line-clamp-2 pr-8 text-base font-semibold">
            {run?.title ?? t('Untitled run')}
          </SheetTitle>
          {!isNil(run) && <MetaStrip run={run} />}
        </SheetHeader>
        {isError ? (
          <DataFetchErrorState
            entity={t('run')}
            onRetry={() => void refetch()}
          />
        ) : isLoading || isNil(run) ? (
          <div className="flex flex-col gap-3 px-6 py-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <ScrollArea className="min-h-0 grow">
            <div className="flex flex-col gap-6 px-6 py-5">
              {run.uiMessages?.map((message, messageIndex) =>
                message.role === PersistedAgentRole.USER ? (
                  <Prompt key={messageIndex} parts={message.parts} />
                ) : (
                  <div key={messageIndex} className="flex flex-col gap-6">
                    {message.parts.map((part, partIndex) => (
                      <Part key={partIndex} part={part} index={partIndex} />
                    ))}
                  </div>
                ),
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
};

const MetaStrip = ({ run }: { run: AgentRunListItem }) => {
  const look = agentRunUtils.getStatusIcon(run.status);
  const durationMs = agentRunUtils.getDurationMs(run);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <StatusIconWithText
        icon={look.Icon}
        text={agentRunUtils.getStatusLabel(run.status)}
        variant={look.variant}
      />
      {!isNil(durationMs) && (
        <>
          <Dot />
          <span>{formatUtils.formatDuration(durationMs, true)}</span>
        </>
      )}
      {!isNil(run.aiCredits) && (
        <>
          <Dot />
          <span>{t('{credits} credits', { credits: run.aiCredits })}</span>
        </>
      )}
      {!isNil(run.flow) && (
        <>
          <Dot />
          <a
            href={authenticationSession.appendProjectRoutePrefix(
              `/runs/${run.flow.flowRunId}`,
            )}
            className="flex min-w-0 items-center gap-1 hover:underline"
          >
            <span className="min-w-0 truncate">{run.flow.displayName}</span>
            <ArrowUpRight size={12} className="shrink-0" />
          </a>
        </>
      )}
    </div>
  );
};

const Dot = () => <span aria-hidden="true">&middot;</span>;

const Prompt = ({ parts }: { parts: PersistedAgentPart[] }) => {
  const text = parts
    .filter((part) => part.type === PersistedAgentPartType.TEXT)
    .map((part) => part.text)
    .join('\n');
  if (text.length === 0) {
    return null;
  }
  return <PromptBlock prompt={text} />;
};

const Part = ({ part, index }: { part: PersistedAgentPart; index: number }) => {
  if (part.type === PersistedAgentPartType.TEXT) {
    return (
      <MarkdownBlock
        index={index}
        step={{ type: ContentBlockType.MARKDOWN, markdown: part.text }}
      />
    );
  }
  if (part.type === PersistedAgentPartType.TOOL_CALL) {
    return <ToolCall part={part} />;
  }
  if (part.type === PersistedAgentPartType.REASONING) {
    return (
      <TimelineItem icon={<Brain className="h-4 w-4 text-muted-foreground" />}>
        <p className="py-3 text-sm text-muted-foreground">{part.text}</p>
      </TimelineItem>
    );
  }
  if (
    part.type === PersistedAgentPartType.IMAGE ||
    part.type === PersistedAgentPartType.FILE ||
    part.type === PersistedAgentPartType.SOURCE_URL
  ) {
    return (
      <TimelineItem
        icon={<Paperclip className="h-4 w-4 text-muted-foreground" />}
      >
        <a
          href={part.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 py-3 text-sm hover:underline"
        >
          <span className="min-w-0 truncate">{partLabel(part)}</span>
          <ArrowUpRight size={12} className="shrink-0" />
        </a>
      </TimelineItem>
    );
  }
  // Thinking status and batch progress are transient: they narrate a run while it happens
  // and say nothing once it has finished, so a finished transcript leaves them out.
  return null;
};

function partLabel(part: PersistedAgentPart): string {
  if (part.type === PersistedAgentPartType.IMAGE) {
    return part.title ?? t('Image');
  }
  if (part.type === PersistedAgentPartType.FILE) {
    return part.fileName;
  }
  if (part.type === PersistedAgentPartType.SOURCE_URL) {
    return part.title ?? part.url;
  }
  return '';
}

const ToolCall = ({
  part,
}: {
  part: Extract<PersistedAgentPart, { type: PersistedAgentPartType.TOOL_CALL }>;
}) => {
  const failed = part.status === PersistedToolCallStatus.ERROR;
  const [open, setOpen] = useState(failed);
  const hasInput = Object.keys(part.input ?? {}).length > 0;
  const hasOutput = !isNil(part.output);

  return (
    <TimelineItem
      icon={
        failed ? (
          <CircleAlert className="h-4 w-4 text-destructive" />
        ) : (
          <CircleCheck className="h-4 w-4 text-muted-foreground" />
        )
      }
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 py-3 text-left text-sm">
          <span className="min-w-0 truncate">
            {part.title ?? (
              <span className="font-mono text-xs">{part.toolName}</span>
            )}
          </span>
          <ChevronRight
            size={14}
            className={cn(
              'shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-90',
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 pt-3">
          {failed && !isNil(part.errorText) && (
            <p className="text-xs text-destructive">{part.errorText}</p>
          )}
          {hasInput && <Payload label={t('Input')} value={part.input} />}
          {hasOutput && <Payload label={t('Output')} value={part.output} />}
        </CollapsibleContent>
      </Collapsible>
    </TimelineItem>
  );
};

const Payload = ({ label, value }: { label: string; value: unknown }) => (
  <JsonViewer
    json={value}
    title={
      <span className="text-xss font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    }
    hideDownload
  />
);
