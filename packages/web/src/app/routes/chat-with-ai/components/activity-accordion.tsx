import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';

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

import { StreamingText } from './streaming-text';

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

  const isExpandable = hasSteps || hasReasoning;

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
                isStreaming={isStreaming}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function StepRenderer({
  step,
  isStreaming,
}: {
  step: ThinkingStep;
  isStreaming: boolean;
}) {
  switch (step.kind) {
    case 'reasoning':
      return (
        <div className="py-0.5">
          {isStreaming ? (
            <StreamingText
              text={step.text}
              isStreaming={true}
              className="whitespace-pre-wrap break-words text-sm text-muted-foreground leading-relaxed"
            />
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground leading-relaxed">
              {step.text}
            </p>
          )}
        </div>
      );
    case 'thinking-status':
      return (
        <div className="py-0.5">
          {isStreaming ? (
            <StreamingText
              text={step.text}
              isStreaming={true}
              className="text-sm text-muted-foreground"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{step.text}</p>
          )}
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
  const resolvedDescription =
    description ??
    (rawInput &&
    typeof rawInput.description === 'string' &&
    rawInput.description
      ? rawInput.description
      : null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const input = useMemo(() => {
    if (!rawInput) return undefined;
    const {
      title: _t,
      description: _d,
      activeTitle: _a,
      doneTitle: _dt,
      ...rest
    } = rawInput;
    return Object.keys(rest).length > 0 ? rest : undefined;
  }, [rawInput]);
  const output = chatPartUtils.extractToolOutputText(part);
  const hasInput = input && Object.keys(input).length > 0;
  const hasOutput = Boolean(output);
  const hasDetails = hasInput || hasOutput;
  const parsedOutput = useMemo(
    () => (detailsOpen && output ? tryParseJson(output) : undefined),
    [detailsOpen, output],
  );
  const connectionLabel = useMemo(() => {
    if (part.state !== 'output-available' || !part.output) return undefined;
    const raw =
      typeof part.output === 'string' ? tryParseJson(part.output) : part.output;
    if (!raw || typeof raw !== 'object') return undefined;
    const meta = (raw as Record<string, unknown>)['_meta'];
    if (!meta || typeof meta !== 'object') return undefined;
    const label = (meta as Record<string, unknown>)['connectionLabel'];
    return typeof label === 'string' ? label : undefined;
  }, [part.state, part.output]);
  const pieceNames = useMemo(
    () => chatPartUtils.extractPieceNames(rawInput),
    [rawInput],
  );
  const { summaries: pieceSummaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const matchedPieces = pieceSummaries.filter((p) => p.logoUrl);

  const label =
    status === 'running'
      ? activeTitle ?? activeFallback
      : status === 'completed'
      ? doneTitle ?? doneFallback
      : doneFallback;

  return (
    <div className="py-1">
      {resolvedDescription && (
        <p className="text-sm text-muted-foreground mb-1.5">
          {resolvedDescription}
        </p>
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
                'inline-flex items-center gap-2 rounded-lg border px-4 py-1.5 text-sm',
                status === 'failed' ? 'border-destructive/30' : 'border-border',
                hasDetails && 'cursor-pointer',
              )}
              onClick={() => hasDetails && setDetailsOpen(!detailsOpen)}
            >
              <span
                className={cn(
                  'text-sm',
                  status === 'failed'
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
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
            {connectionLabel && (
              <p className="text-xs text-muted-foreground mt-0.5 ml-1">
                {t('via {connectionLabel}', { connectionLabel })}
              </p>
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
    </div>
  );
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
