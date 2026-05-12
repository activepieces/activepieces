import { t } from 'i18next';
import { Check, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Fragment, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ChatUIMessage, DynamicToolPart } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { BuildProgressData, normalizePieceName } from '../lib/message-parsers';

type StepStatus =
  | 'queued'
  | 'added'
  | 'configuring'
  | 'validating'
  | 'ready'
  | 'error';

const STEP_ORDER: Record<StepStatus, number> = {
  queued: 0,
  added: 1,
  configuring: 2,
  validating: 3,
  ready: 4,
  error: 4,
};

const ANIMATION_DELAY_MS = 350;

function isBuildTool(name: string): boolean {
  return chatUtils.BUILD_TOOL_NAMES.has(name);
}

const APPLY_TOOLS = new Set([
  'ap_update_trigger',
  'ap_add_step',
  'ap_update_step',
]);

function computeTargetStatuses({
  steps,
  toolParts,
}: {
  steps: BuildProgressData['steps'];
  toolParts: DynamicToolPart[];
}): StepStatus[] {
  const buildTools = toolParts.filter((t) => isBuildTool(t.toolName));
  if (buildTools.length === 0) return steps.map(() => 'queued');

  const statuses: StepStatus[] = steps.map(() => 'queued');

  const validateFlowTool = buildTools.find(
    (t) => t.toolName === 'ap_validate_flow',
  );
  if (validateFlowTool?.state === 'output-available') {
    statuses.fill('ready');
    return statuses;
  }

  // Count fully applied steps (trigger + actions that completed successfully)
  let completedSteps = 0;
  for (const tool of buildTools) {
    if (APPLY_TOOLS.has(tool.toolName) && tool.state === 'output-available') {
      completedSteps++;
    }
  }

  // Mark completed steps as ready
  for (let i = 0; i < Math.min(completedSteps, statuses.length); i++) {
    statuses[i] = 'ready';
  }

  // Determine the current step's status from the LAST relevant tool call
  const currentIdx = Math.min(completedSteps, statuses.length - 1);
  if (completedSteps < statuses.length) {
    const lastRelevantTool = findLastToolForCurrentStep(buildTools);
    if (lastRelevantTool) {
      const isRunning =
        lastRelevantTool.state === 'input-streaming' ||
        lastRelevantTool.state === 'input-available';
      const isError = lastRelevantTool.state === 'output-error';

      if (isError) {
        statuses[currentIdx] = 'error';
      } else if (isRunning) {
        if (lastRelevantTool.toolName === 'ap_validate_step_config') {
          statuses[currentIdx] = 'validating';
        } else {
          statuses[currentIdx] = 'configuring';
        }
      }
    }
  }

  // Final flow validation overrides current step
  if (
    validateFlowTool &&
    (validateFlowTool.state === 'input-streaming' ||
      validateFlowTool.state === 'input-available')
  ) {
    for (let i = 0; i < statuses.length; i++) {
      if (statuses[i] !== 'ready' && statuses[i] !== 'error') {
        statuses[i] = 'validating';
      }
    }
  }

  return statuses;
}

function findLastToolForCurrentStep(
  buildTools: DynamicToolPart[],
): DynamicToolPart | null {
  for (let i = buildTools.length - 1; i >= 0; i--) {
    const tool = buildTools[i];
    if (
      tool.toolName === 'ap_validate_flow' ||
      tool.toolName === 'ap_create_flow' ||
      tool.toolName === 'ap_build_flow'
    )
      continue;
    // Stop at completed apply tools — errors before this belong to previous steps
    if (APPLY_TOOLS.has(tool.toolName) && tool.state === 'output-available') {
      return null;
    }
    if (
      tool.state === 'input-streaming' ||
      tool.state === 'input-available' ||
      tool.state === 'output-error'
    ) {
      return tool;
    }
  }
  return null;
}

function advanceOneStep({
  current,
  target,
}: {
  current: StepStatus[];
  target: StepStatus[];
}): StepStatus[] | null {
  for (let i = 0; i < current.length; i++) {
    if (current[i] === target[i]) continue;
    // Never go backward — once ready, stay ready
    if (STEP_ORDER[current[i]] > STEP_ORDER[target[i]]) continue;

    const next = [...current];
    const progression: StepStatus[] = [
      'queued',
      'added',
      'configuring',
      'validating',
      'ready',
    ];
    const currentIdx = progression.indexOf(current[i]);
    const targetIdx = progression.indexOf(target[i]);
    if (currentIdx >= 0 && targetIdx > currentIdx) {
      next[i] = progression[currentIdx + 1];
    } else {
      next[i] = target[i];
    }
    return next;
  }
  return null;
}

function extractFlowUrl(toolParts: DynamicToolPart[]): string | null {
  for (const tool of toolParts) {
    if (tool.state !== 'output-available' || !tool.output) continue;
    const output = tool.output as Record<string, unknown>;
    if (typeof output.flowUrl === 'string') return output.flowUrl;
    if (typeof output.url === 'string') return output.url;
    const content = output.content as Array<{ text?: string }> | undefined;
    if (content?.[0]?.text) {
      const urlMatch = /https?:\/\/[^\s)]+\/flows\/[^\s)]+/.exec(
        content[0].text,
      );
      if (urlMatch) return urlMatch[0];
    }
    if (typeof output.text === 'string') {
      const urlMatch = /https?:\/\/[^\s)]+\/flows\/[^\s)]+/.exec(output.text);
      if (urlMatch) return urlMatch[0];
    }
  }
  return null;
}

function stepTypeLabel({
  type,
  index,
}: {
  type: 'trigger' | 'action';
  index: number;
}): string {
  if (type === 'trigger') return t('TRIGGER');
  return t('ACTION {number}', { number: index });
}

function useAnimatedStatuses({
  targetStatuses,
  stepCount,
  isStreaming,
}: {
  targetStatuses: StepStatus[];
  stepCount: number;
  isStreaming: boolean;
}): StepStatus[] {
  const [displayed, setDisplayed] = useState<StepStatus[]>(() =>
    isStreaming
      ? Array.from({ length: stepCount }, () => 'queued' as StepStatus)
      : targetStatuses,
  );

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(targetStatuses);
      return;
    }

    const next = advanceOneStep({ current: displayed, target: targetStatuses });
    if (!next) return;

    const hasAnyProgress = displayed.some(
      (s, i) => STEP_ORDER[s] > 0 || STEP_ORDER[targetStatuses[i]] > 0,
    );
    const delay = hasAnyProgress ? ANIMATION_DELAY_MS : 0;

    const timer = setTimeout(() => setDisplayed(next), delay);
    return () => clearTimeout(timer);
  }, [targetStatuses, displayed, isStreaming]);

  return displayed;
}

export function BuildProgressCard({
  progress,
  toolParts,
  allParts,
  isStreaming = false,
}: BuildProgressCardProps) {
  const reduce = useReducedMotion();
  const dynamicParts = useMemo(
    () =>
      toolParts.filter((p): p is DynamicToolPart => p.type === 'dynamic-tool'),
    [toolParts],
  );

  const targetStatuses = useMemo(
    () =>
      computeTargetStatuses({ steps: progress.steps, toolParts: dynamicParts }),
    [progress.steps, dynamicParts],
  );

  const stepStatuses = useAnimatedStatuses({
    targetStatuses,
    stepCount: progress.steps.length,
    isStreaming,
  });

  const isBuilt = stepStatuses.every((s) => s === 'ready');
  const notesStatus = useMemo(() => {
    const noteTools = dynamicParts.filter(
      (t) => t.toolName === 'ap_manage_notes',
    );
    if (noteTools.length === 0) return 'none';
    const allDone = noteTools.every((t) => t.state === 'output-available');
    if (allDone) return 'done';
    return 'adding';
  }, [dynamicParts]);
  const isValidating = stepStatuses.some((s) => s === 'validating');
  const hasError = stepStatuses.some((s) => s === 'error');
  const flowUrl = useMemo(() => {
    const fromTools = extractFlowUrl(dynamicParts);
    if (fromTools) return fromTools;
    const textParts = allParts ?? toolParts;
    const allText = textParts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');
    const match = /https?:\/\/[^\s)]+\/flows\/[^\s)]+/.exec(allText);
    return match ? match[0] : null;
  }, [dynamicParts, allParts, toolParts]);

  const actionIndices = useMemo(() => {
    let counter = 0;
    return progress.steps.map((step) =>
      step.type === 'action' ? ++counter : 0,
    );
  }, [progress.steps]);

  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.3 }}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-xs flex items-center gap-1.5">
            <span>✨</span>
            {progress.title}
          </h3>
          {isBuilt &&
          (notesStatus === 'adding' ||
            (notesStatus === 'none' && isStreaming)) ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-0.5 text-xs font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('Finishing up...')}
            </span>
          ) : isBuilt ? (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
              <Check className="h-3.5 w-3.5" />
              {t('Done')}
            </span>
          ) : hasError ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-medium">
              {t('Error')}
            </span>
          ) : isValidating ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('Validating...')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
              {isStreaming && (
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              )}
              {t('Building')}
            </span>
          )}
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="flex flex-col items-stretch">
          {progress.steps.map((step, index) => {
            const status = stepStatuses[index];
            const typeLabel =
              step.type === 'trigger'
                ? stepTypeLabel({ type: 'trigger', index: 0 })
                : stepTypeLabel({
                    type: 'action',
                    index: actionIndices[index],
                  });
            const pieceName = normalizePieceName(step.piece);

            return (
              <Fragment key={index}>
                {index > 0 && <StepConnector index={index} reduce={!!reduce} />}
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.18,
                    delay: reduce ? 0 : index * 0.06,
                  }}
                  className={cn(
                    'rounded-lg border border-dashed px-3 py-2 transition-all duration-300',
                    status === 'configuring' &&
                      'border-primary/40 bg-primary/5',
                    status === 'validating' &&
                      'border-amber-500/40 bg-amber-500/5',
                    status === 'error' &&
                      'border-destructive/40 bg-destructive/5',
                    status === 'added' && 'border-green-500/30 bg-green-500/5',
                    (status === 'ready' || status === 'queued') &&
                      'border-muted-foreground/20 bg-muted/20',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {typeLabel}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium transition-all duration-300',
                        status === 'ready' && 'text-foreground/70',
                        status === 'added' &&
                          'text-green-600 dark:text-green-400',
                        status === 'configuring' && 'text-primary',
                        status === 'validating' &&
                          'text-amber-600 dark:text-amber-400',
                        status === 'error' && 'text-destructive',
                        status === 'queued' && 'text-muted-foreground/40',
                      )}
                    >
                      {(status === 'configuring' ||
                        status === 'validating') && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {statusLabel(status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PieceIconWithPieceName
                      pieceName={pieceName}
                      size="xs"
                      border={false}
                      showTooltip={false}
                    />
                    <span className="text-xs font-medium text-foreground/90 truncate">
                      {step.label}
                    </span>
                  </div>
                </motion.div>
              </Fragment>
            );
          })}
        </div>

        {isBuilt && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, delay: 0.1 }}
            className="mt-3"
          >
            {flowUrl && (
              <Button
                size="sm"
                className="w-full gap-1.5"
                onClick={() => window.open(flowUrl, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t('Open flow')}
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function statusLabel(status: StepStatus): string {
  switch (status) {
    case 'ready':
      return t('Ready');
    case 'added':
      return t('Added');
    case 'configuring':
      return t('Setting up...');
    case 'validating':
      return t('Checking...');
    case 'error':
      return t('Error');
    case 'queued':
      return t('Queued');
  }
}

function StepConnector({ index, reduce }: { index: number; reduce: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduce ? 0 : 0.16,
        delay: reduce ? 0 : index * 0.06 - 0.02,
      }}
      className="relative flex h-3 items-center justify-center"
    >
      <span className="h-full w-px bg-border" />
      <ChevronDown className="absolute h-3 w-3 text-muted-foreground/60" />
    </motion.div>
  );
}

type BuildProgressCardProps = {
  progress: BuildProgressData;
  toolParts: ChatUIMessage['parts'];
  allParts?: ChatUIMessage['parts'];
  isStreaming?: boolean;
};
