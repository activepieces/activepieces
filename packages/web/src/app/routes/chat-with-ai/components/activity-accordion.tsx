import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Code } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  AnyToolPart,
  ThinkingStep,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';

import { ChatLine } from './chat-ui/chat-line';
import { ChatStatusIcon } from './chat-ui/chat-status';
import { chatStatusUtils } from './chat-ui/chat-status-utils';
import {
  CodeRecipeList,
  LiveThinkingLine,
  StepLogos,
  getRecipeLines,
} from './tool-shimmer-pills';

export function ThinkingBlock({
  thinkingSteps,
  isStreaming,
  thinkingDurationMs,
  onOpenChange,
}: {
  thinkingSteps: ThinkingStep[];
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

  const toolSteps = useMemo(
    () => thinkingSteps.flatMap((step) => (step.kind === 'tool' ? [step] : [])),
    [thinkingSteps],
  );
  const failedSteps = toolSteps.filter(
    (step) => chatPartUtils.deriveToolStatus(step.part) === 'failed',
  );

  const hasSteps = thinkingSteps.length > 0;
  if (!hasSteps && !isStreaming) return null;

  const toggle = hasSteps ? () => handleOpenChange(!isOpen) : undefined;

  return (
    <motion.div
      initial={isStreaming ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        {isStreaming ? (
          <LiveThinkingLine
            steps={thinkingSteps}
            open={isOpen}
            onToggle={toggle}
          />
        ) : (
          <ChatLine open={isOpen} onToggle={toggle}>
            {formatSummary({
              stepCount: toolSteps.length,
              durationMs: thinkingDurationMs,
            })}
          </ChatLine>
        )}

        {!isOpen && !isStreaming && failedSteps.length > 0 && (
          <div className="ml-1.5 border-l border-gray-6 pl-3">
            {failedSteps.map((step) => (
              <ToolStepLine
                key={step.part.toolCallId}
                part={step.part}
                description={null}
              />
            ))}
          </div>
        )}

        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="ml-1.5 mt-1 space-y-0.5 border-l border-gray-6 pl-3">
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
    case 'reasoning':
      return (
        <p className="max-h-64 overflow-y-auto py-1 text-sm text-gray-11 whitespace-pre-wrap break-words">
          {step.text}
        </p>
      );
    case 'thinking-status':
      return <p className="py-1 text-sm text-gray-11">{step.text}</p>;
    case 'tool':
      return <ToolStepLine part={step.part} description={step.description} />;
  }
}

function ToolStepLine({
  part,
  description,
}: {
  part: AnyToolPart;
  description: string | null;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const status = chatPartUtils.deriveToolStatus(part);
  const { activeTitle, doneTitle } = chatPartUtils.extractToolTitles(part);
  const rawInput = isObject(part.input) ? part.input : undefined;
  const isRunCode = chatPartUtils.getToolPartName(part) === 'ap_run_code';
  const recipeLines = useMemo(() => getRecipeLines(part), [part]);
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
  const hasDetails = Boolean(input) || Boolean(output);
  const parsedOutput = useMemo(
    () => (detailsOpen && output ? tryParseJson(output) : undefined),
    [detailsOpen, output],
  );

  const label =
    status === 'running'
      ? activeTitle ?? chatUtils.formatToolActionName({ part })
      : status === 'completed'
      ? doneTitle ?? chatUtils.formatToolDoneTitle({ part })
      : chatUtils.formatToolDoneTitle({ part });
  const failureReason =
    part.state === 'output-error' && part.errorText ? part.errorText : null;

  return (
    <div className="py-0.5">
      {recipeLines.length === 0 && resolvedDescription && (
        <p className="py-1 text-sm text-gray-11">{resolvedDescription}</p>
      )}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <ChatLine
          icon={
            <ChatStatusIcon status={chatStatusUtils.fromToolStatus(status)} />
          }
          logos={<StepLogos parts={[part]} />}
          detail={failureReason}
          tone={status === 'failed' ? 'danger' : 'muted'}
          open={detailsOpen}
          onToggle={hasDetails ? () => setDetailsOpen(!detailsOpen) : undefined}
        >
          {label}
        </ChatLine>
        {hasDetails && (
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <dl className="ml-5.5 mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-md border border-gray-6 bg-gray-2 px-3 py-2 text-xs">
              {input && (
                <>
                  <dt className="pt-2 text-gray-11">{t('Sent')}</dt>
                  <dd className="min-w-0">
                    <SimpleJsonViewer
                      data={input}
                      hideCopyButton={true}
                      maxHeight={100}
                      fontSize="11px"
                    />
                  </dd>
                </>
              )}
              {output && parsedOutput !== undefined && (
                <>
                  <dt className="pt-2 text-gray-11">{t('Got back')}</dt>
                  <dd className="min-w-0">
                    <SimpleJsonViewer
                      data={parsedOutput}
                      hideCopyButton={true}
                      maxHeight={120}
                      fontSize="11px"
                    />
                  </dd>
                </>
              )}
            </dl>
          </CollapsibleContent>
        )}
      </Collapsible>
      {recipeLines.length > 0 && (
        <CodeRecipeList lines={recipeLines} className="ml-1.5" />
      )}
      {codeSource && (
        <Collapsible open={codeOpen} onOpenChange={setCodeOpen}>
          <button
            type="button"
            onClick={() => setCodeOpen(!codeOpen)}
            className="ml-5.5 flex items-center gap-1 rounded-md py-1 text-xs text-accent-11 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-gray-8"
          >
            <Code className="size-3 shrink-0" />
            {codeOpen ? t('Hide code') : t('View code')}
          </button>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <pre className="ml-5.5 mt-1 max-h-64 overflow-auto rounded-md border border-gray-6 bg-gray-2 px-3 py-2 font-mono text-xs whitespace-pre-wrap break-words text-gray-12">
              {codeSource}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function formatSummary({
  stepCount,
  durationMs,
}: {
  stepCount: number;
  durationMs: number | undefined;
}): string {
  if (stepCount === 0) return formatThinkingDuration(durationMs);
  const duration = formatShortDuration(durationMs);
  if (duration === null) {
    return t('Checked {count} {count, plural, =1 {thing} other {things}}', {
      count: stepCount,
    });
  }
  return t(
    'Checked {count} {count, plural, =1 {thing} other {things}} in {duration}',
    { count: stepCount, duration },
  );
}

function formatShortDuration(ms: number | undefined): string | null {
  if (ms === undefined) return null;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds <= 0) return null;
  if (totalSeconds < 60) return t('{seconds}s', { seconds: totalSeconds });
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) return t('{minutes}m', { minutes });
  return t('{minutes}m {seconds}s', { minutes, seconds });
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
