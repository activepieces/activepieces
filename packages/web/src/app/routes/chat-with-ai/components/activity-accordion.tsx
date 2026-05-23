import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Brain,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Search,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useMemo, useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { TextShimmer } from '@/components/ui/text-shimmer';
import {
  AnyToolPart,
  ThinkingStep,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

export function ThinkingBlock({
  thinkingSteps,
  reasoningText,
  isStreaming,
  thinkingDurationMs,
}: {
  thinkingSteps: ThinkingStep[];
  reasoningText: string;
  isStreaming: boolean;
  thinkingDurationMs?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const hasReasoning = reasoningText.length > 0;
  const hasSteps = thinkingSteps.length > 0;

  if (!hasSteps && !hasReasoning && !isStreaming) return null;

  const isExpandable = hasSteps || hasReasoning;

  const doneLabel =
    thinkingDurationMs !== undefined
      ? t('Thought for {seconds} seconds', {
          seconds: Math.round(thinkingDurationMs / 1000),
        })
      : t('Thought for a few seconds');

  const lastStep = hasSteps ? thinkingSteps[thinkingSteps.length - 1] : null;
  const lastStepIdx = thinkingSteps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {isStreaming ? (
        <div>
          <TextShimmer className="text-sm" duration={3}>
            {t('Thinking...')}
          </TextShimmer>

          {lastStep && (
            <div className="mt-3 ml-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`step-${lastStepIdx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepRenderer
                    step={lastStep}
                    showConnector={false}
                    isStreaming={true}
                    showIcon={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <button
            type="button"
            disabled={!isExpandable}
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex items-center gap-1.5 text-sm text-muted-foreground text-left w-full',
              isExpandable &&
                'hover:text-foreground transition-colors cursor-pointer',
            )}
          >
            <span>{doneLabel}</span>
            {isExpandable && (
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-muted-foreground/50 transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            )}
          </button>

          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div className="mt-3 ml-1">
              {thinkingSteps.map((step, idx) => (
                <StepRenderer
                  key={
                    step.kind === 'tool'
                      ? step.part.toolCallId
                      : `${step.kind}-${idx}`
                  }
                  step={step}
                  showConnector={true}
                  isStreaming={false}
                  showIcon={true}
                />
              ))}

              {hasSteps && (
                <div className="flex gap-3 items-center">
                  <div className="flex items-center justify-center size-5 rounded-full bg-muted">
                    <Check className="size-3 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t('Done')}
                  </span>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
}

function StepRenderer({
  step,
  showConnector,
  isStreaming,
  showIcon,
}: {
  step: ThinkingStep;
  showConnector: boolean;
  isStreaming: boolean;
  showIcon: boolean;
}) {
  switch (step.kind) {
    case 'reasoning':
      return (
        <StepLayout
          showIcon={showIcon}
          showConnector={showConnector}
          icon={Brain}
        >
          <p
            className={cn(
              'whitespace-pre-wrap break-words line-clamp-3',
              isStreaming
                ? 'text-sm text-foreground'
                : 'text-xs text-muted-foreground',
            )}
          >
            {step.text}
          </p>
        </StepLayout>
      );
    case 'thinking-status':
      return (
        <StepLayout
          showIcon={showIcon}
          showConnector={showConnector}
          icon={Clock}
        >
          {isStreaming ? (
            <TextShimmer className="text-sm" duration={3}>
              {step.text}
            </TextShimmer>
          ) : (
            <p className="text-xs text-muted-foreground">{step.text}</p>
          )}
          {step.toolPart && (
            <div className="mt-2">
              <ToolCard part={step.toolPart} />
            </div>
          )}
        </StepLayout>
      );
    case 'tool':
      return (
        <ToolStep
          part={step.part}
          showConnector={showConnector}
          showIcon={showIcon}
        />
      );
  }
}

function StepLayout({
  showIcon,
  showConnector,
  icon: Icon,
  children,
}: {
  showIcon: boolean;
  showConnector: boolean;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {showIcon && (
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center justify-center size-5 rounded-full bg-muted">
            <Icon className="size-3 text-muted-foreground" />
          </div>
          {showConnector && <div className="w-px flex-1 bg-border min-h-3" />}
        </div>
      )}
      <div className="flex-1 min-w-0 pb-4 pt-0.5">{children}</div>
    </div>
  );
}

function ToolStep({
  part,
  showConnector,
  showIcon,
}: {
  part: AnyToolPart;
  showConnector: boolean;
  showIcon: boolean;
}) {
  const status = chatPartUtils.deriveToolStatus(part);
  const icon =
    status === 'running' ? Loader2 : status === 'failed' ? XCircle : Wrench;

  return (
    <StepLayout showIcon={showIcon} showConnector={showConnector} icon={icon}>
      <ToolCard part={part} />
    </StepLayout>
  );
}

function ToolCard({ part }: { part: AnyToolPart }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const input = isObject(part.input) ? part.input : undefined;
  const output = chatPartUtils.extractToolOutputText(part);
  const hasInput = input && Object.keys(input).length > 0;
  const hasOutput = Boolean(output);
  const hasDetails = hasInput || hasOutput;
  const parsedOutput = useMemo(
    () => (detailsOpen && output ? tryParseJson(output) : undefined),
    [detailsOpen, output],
  );
  const pieceNames = useMemo(
    () => chatPartUtils.extractPieceNames(input),
    [input],
  );
  const { summaries: pieceSummaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const summary = buildToolSummary({ part });

  return (
    <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1',
          hasDetails && 'cursor-pointer hover:bg-muted/50 transition-colors',
        )}
        onClick={() => hasDetails && setDetailsOpen(!detailsOpen)}
      >
        <summary.icon className="size-3 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {summary.label}
        </span>
        {pieceSummaries.map(
          (piece) =>
            piece.logoUrl && (
              <PieceIcon
                key={piece.name}
                displayName={piece.displayName}
                logoUrl={piece.logoUrl}
                size="xxs"
                border={false}
                showTooltip={true}
              />
            ),
        )}
        {hasDetails && (
          <ChevronDown
            className={cn(
              'size-3 shrink-0 text-muted-foreground/50 transition-transform',
              detailsOpen && 'rotate-180',
            )}
          />
        )}
      </div>
      {hasDetails && (
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="mt-1.5 space-y-1.5 text-[11px]">
            {hasInput && input && (
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  {t('Input')}
                </p>
                <SimpleJsonViewer
                  data={input}
                  hideCopyButton={true}
                  maxHeight={100}
                  fontSize="11px"
                />
              </div>
            )}
            {hasOutput && parsedOutput !== undefined && (
              <div>
                <p className="text-muted-foreground font-medium mb-0.5">
                  {t('Output')}
                </p>
                <SimpleJsonViewer
                  data={parsedOutput}
                  hideCopyButton={true}
                  maxHeight={120}
                  fontSize="11px"
                />
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function buildToolSummary({ part }: { part: AnyToolPart }): {
  icon: React.FC<{ className?: string }>;
  label: string;
} {
  const toolName = chatPartUtils.getToolPartName(part);
  const icon =
    toolName === 'ap_run_one_time_action'
      ? Zap
      : toolName.startsWith('mcp__')
      ? Wrench
      : Search;
  return { icon, label: chatUtils.formatToolActionName({ part }) };
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
