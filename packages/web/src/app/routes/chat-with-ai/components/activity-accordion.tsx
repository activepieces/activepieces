import { isObject } from '@activepieces/core-utils';
import { ChatContextCompression } from '@activepieces/shared';
import { t } from 'i18next';
import { Archive, ChevronDown, Code } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AnyToolPart,
  ThinkingStep,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { toolIconUtils } from '@/features/chat/lib/tool-icons';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

import { DelayedTooltip } from './delayed-tooltip';

export function ThinkingBlock({
  thinkingSteps,
  reasoningText,
  isStreaming,
  thinkingDurationMs,
  onOpenChange,
}: {
  thinkingSteps: ThinkingStep[];
  reasoningText: string;
  isStreaming: boolean;
  thinkingDurationMs?: number;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const hasReasoning = reasoningText.length > 0;
  const hasSteps = thinkingSteps.length > 0;

  if (!hasSteps && !hasReasoning && !isStreaming) return null;

  const isExpandable = hasSteps;

  const doneLabel = formatThinkingDuration(thinkingDurationMs);

  return (
    <motion.div
      initial={isStreaming ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <button
          type="button"
          disabled={!isExpandable}
          onClick={() => handleOpenChange(!isOpen)}
          className={cn(
            'flex items-center gap-1.5 text-sm text-muted-foreground text-left w-full',
            isExpandable &&
              'hover:text-foreground transition-colors cursor-pointer',
          )}
        >
          {isStreaming ? (
            <TextShimmer className="text-sm" duration={2}>
              {t('Thinking...')}
            </TextShimmer>
          ) : (
            <span>{doneLabel}</span>
          )}
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 transition-all duration-300',
              isOpen && 'rotate-180',
              isExpandable ? 'opacity-50 text-muted-foreground' : 'opacity-0',
            )}
          />
        </button>

        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="mt-2 space-y-0.5">
            {thinkingSteps.map((step, idx) => (
              <StepRenderer
                key={
                  step.kind === 'tool'
                    ? step.part.toolCallId
                    : `${step.kind}-${idx}`
                }
                step={step}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function StepRenderer({ step }: { step: ThinkingStep }) {
  switch (step.kind) {
    case 'thinking-status':
      return (
        <div className="py-0.5">
          <p className="text-sm text-muted-foreground">{step.text}</p>
        </div>
      );
    case 'tool':
      return <ToolStepRow part={step.part} description={step.description} />;
  }
}

function ToolStepRow({
  part,
  description,
}: {
  part: AnyToolPart;
  description: string | null;
}) {
  const status = chatPartUtils.deriveToolStatus(part);
  const { activeTitle, doneTitle } = chatPartUtils.extractToolTitles(part);
  const activeFallback = chatUtils.formatToolActionName({ part });
  const doneFallback = chatUtils.formatToolDoneTitle({ part });
  const rawInput = isObject(part.input) ? part.input : undefined;
  const isRunCode = chatPartUtils.getToolPartName(part) === 'ap_run_code';
  const recipeLines = useMemo(() => {
    if (!isRunCode || !Array.isArray(rawInput?.recipe)) return [];
    return rawInput.recipe.filter(
      (line): line is string => typeof line === 'string',
    );
  }, [isRunCode, rawInput]);
  const codeSource = useMemo(() => {
    if (!isRunCode || !rawInput) return null;
    const code = typeof rawInput.code === 'string' ? rawInput.code : '';
    const packageJson =
      typeof rawInput.packageJson === 'string' ? rawInput.packageJson : '';
    if (!code && !packageJson) return null;
    return packageJson ? `${code}\n\n// package.json\n${packageJson}` : code;
  }, [isRunCode, rawInput]);
  const resolvedDescription =
    description ??
    (rawInput &&
    typeof rawInput.description === 'string' &&
    rawInput.description
      ? rawInput.description
      : null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const input = useMemo(() => {
    if (!rawInput) return undefined;
    const {
      title: _t,
      description: _d,
      activeTitle: _a,
      doneTitle: _dt,
      ...rest
    } = rawInput;
    if (isRunCode) {
      delete rest.code;
      delete rest.packageJson;
      delete rest.inputFileIds;
      delete rest.input;
      delete rest.recipe;
    }
    return Object.keys(rest).length > 0 ? rest : undefined;
  }, [rawInput, isRunCode]);
  const output = chatPartUtils.extractToolOutputText(part);
  const hasInput = input && Object.keys(input).length > 0;
  const hasOutput = Boolean(output);
  const hasDetails = hasInput || hasOutput;
  const parsedOutput = useMemo(
    () => (detailsOpen && output ? tryParseJson(output) : undefined),
    [detailsOpen, output],
  );
  const compression = useMemo(
    () =>
      status === 'completed'
        ? chatPartUtils.extractContextCompression(part)
        : null,
    [part, status],
  );
  const pieceNames = useMemo(
    () => chatPartUtils.extractPieceNames(rawInput),
    [rawInput],
  );
  const { summaries: pieceSummaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const matchedPieces = pieceSummaries.filter((p) => p.logoUrl);

  const ToolIcon = toolIconUtils.getToolIcon(
    chatPartUtils.getToolPartName(part),
  );

  const label =
    status === 'running'
      ? activeTitle ?? activeFallback
      : status === 'completed'
      ? doneTitle ?? doneFallback
      : doneFallback;

  return (
    <div className="py-1">
      {recipeLines.length > 0 ? (
        <div className="mb-1.5 overflow-hidden rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-1">
            <Code className="size-3 shrink-0 text-primary/80" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {t('What this code does')}
            </span>
          </div>
          <div className="space-y-0.5 px-3 py-2 font-mono text-xs leading-relaxed">
            {recipeLines.map((line, idx) => (
              <div
                key={`${idx}-${line}`}
                className="flex items-start gap-2 text-foreground/75"
              >
                <span className="select-none pt-px text-primary/70">›</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        resolvedDescription && (
          <p className="text-sm text-muted-foreground mb-1.5">
            {resolvedDescription}
          </p>
        )
      )}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        {status === 'running' ? (
          <TextShimmer
            as="div"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-4 py-1.5 text-sm border-border',
              hasDetails && 'cursor-pointer',
            )}
            duration={2}
            onClick={() => hasDetails && setDetailsOpen(!detailsOpen)}
          >
            <ToolIcon className="size-4 shrink-0 text-muted-foreground animate-pulse motion-reduce:animate-none" />
            {label}
            {matchedPieces.map((piece) => (
              <PieceIcon
                key={piece.name}
                displayName={piece.displayName}
                logoUrl={piece.logoUrl!}
                size="xxs"
                border={false}
                showTooltip={false}
              />
            ))}
          </TextShimmer>
        ) : (
          <div>
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-4 py-1.5 text-sm border-border',
                hasDetails && 'cursor-pointer',
              )}
              onClick={() => hasDetails && setDetailsOpen(!detailsOpen)}
            >
              <ToolIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{label}</span>
              {matchedPieces.map((piece) => (
                <PieceIcon
                  key={piece.name}
                  displayName={piece.displayName}
                  logoUrl={piece.logoUrl!}
                  size="xxs"
                  border={false}
                  showTooltip={false}
                />
              ))}
            </div>
            {compression && (
              <ContextCompressionBadge compression={compression} />
            )}
          </div>
        )}
        {hasDetails && (
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div className="mt-1 rounded-lg bg-muted/30 px-3 py-2 space-y-2 text-[11px]">
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
      {codeSource && (
        <Collapsible
          open={codeOpen}
          onOpenChange={setCodeOpen}
          className="mt-1.5"
        >
          <button
            type="button"
            onClick={() => setCodeOpen(!codeOpen)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Code className="size-3 shrink-0" />
            {codeOpen ? t('Hide code') : t('View code')}
          </button>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono whitespace-pre-wrap break-words text-muted-foreground">
              {codeSource}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function ContextCompressionBadge({
  compression,
}: {
  compression: ChatContextCompression;
}) {
  const detail = compressionMethodLabel(compression.method);
  const summary = t('{from} → {to}', {
    from: chatUtils.formatKbBytes(compression.originalBytes),
    to: chatUtils.formatKbBytes(compression.returnedBytes),
  });
  return (
    <DelayedTooltip>
      <TooltipTrigger asChild>
        <span className="mt-1 inline-flex w-fit cursor-default items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Archive className="size-3 shrink-0 text-primary/70" />
          <span>{t('Context compressed')}</span>
          <span className="text-muted-foreground/70">·</span>
          <span className="tabular-nums">{summary}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{detail}</TooltipContent>
    </DelayedTooltip>
  );
}

function compressionMethodLabel(
  method: ChatContextCompression['method'],
): string {
  switch (method) {
    case 'condensed':
      return t('Schema condensed before returning to the model');
    case 'offloaded':
      return t(
        'Full result kept in the sandbox; only a preview returned to the model',
      );
    case 'truncated':
      return t('Result truncated to fit the context budget');
  }
}

function formatThinkingDuration(ms: number | undefined): string {
  if (ms === undefined) return t('Thought for a few seconds');
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds <= 0) return t('Thought for a moment');
  if (totalSeconds < 60) {
    return t(
      'Thought for {seconds} {seconds, plural, =1 {second} other {seconds}}',
      {
        seconds: totalSeconds,
      },
    );
  }
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return t(
      'Thought for {minutes} {minutes, plural, =1 {minute} other {minutes}}',
      {
        minutes,
      },
    );
  }
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  if (remainMinutes > 0) {
    return t(
      'Thought for {hours} {hours, plural, =1 {hour} other {hours}} {minutes} {minutes, plural, =1 {minute} other {minutes}}',
      { hours, minutes: remainMinutes },
    );
  }
  return t('Thought for {hours} {hours, plural, =1 {hour} other {hours}}', {
    hours,
  });
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
