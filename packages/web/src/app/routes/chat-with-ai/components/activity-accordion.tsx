import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DynamicToolPart } from '@/features/chat/lib/chat-types';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';

import { LottieLoader } from './chat-thinking-loader';

const HIDDEN_TOOL_NAMES = new Set([
  'ap_set_session_title',
  'ap_select_project',
  'ap_deselect_project',
]);

const COLLAPSE_DELAY_MS = 600;

export function ActivityAccordion({
  toolParts,
  reasoningText,
  isStreaming,
  hasContent,
}: {
  toolParts: DynamicToolPart[];
  reasoningText: string;
  isStreaming: boolean;
  hasContent: boolean;
}) {
  const visibleParts = useMemo(
    () => toolParts.filter((p) => !HIDDEN_TOOL_NAMES.has(p.toolName)),
    [toolParts],
  );

  const steps = useMemo(() => groupIntoSteps(visibleParts), [visibleParts]);

  const [isOpen, setIsOpen] = useState(isStreaming);
  const userToggledRef = useRef(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isThinkingOnly = isStreaming && visibleParts.length === 0;
  const isActive = isStreaming && visibleParts.length > 0;
  const isComplete = !isStreaming && steps.length > 0;

  const elapsedSeconds = useElapsedTimer(isThinkingOnly);
  const thinkingSnippet = useReasoningSnippet(reasoningText, isThinkingOnly);

  useEffect(() => {
    if (userToggledRef.current) return;

    if (isActive || isThinkingOnly) {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      setIsOpen(true);
    } else if (hasContent && isComplete) {
      collapseTimerRef.current = setTimeout(() => {
        if (!userToggledRef.current) {
          setIsOpen(false);
        }
        collapseTimerRef.current = null;
      }, COLLAPSE_DELAY_MS);
    }

    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [isActive, isThinkingOnly, hasContent, isComplete]);

  const handleToggle = useCallback(() => {
    userToggledRef.current = true;
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setIsOpen((prev) => !prev);
  }, []);

  if (steps.length === 0 && !isStreaming) return null;

  const showLottie = isThinkingOnly || isActive;
  const hasExpandableContent = steps.length > 0;

  const label = isThinkingOnly
    ? t('Thinking...')
    : isActive
    ? steps[steps.length - 1]?.chipLabel ?? t('Working on it')
    : t('stepsCompleted', { count: steps.length });

  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div
        role={hasExpandableContent ? 'button' : undefined}
        tabIndex={hasExpandableContent ? 0 : undefined}
        onClick={hasExpandableContent ? handleToggle : undefined}
        className={cn(
          'flex items-center gap-0.5 text-xs text-muted-foreground',
          hasExpandableContent &&
            'hover:text-foreground transition-colors cursor-pointer',
        )}
      >
        {showLottie && <LottieLoader />}

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isThinkingOnly ? 'thinking' : isActive ? 'active' : 'done'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={
              showLottie
                ? 'bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-muted-foreground from-30% via-neutral-300 via-50% to-muted-foreground to-70% bg-clip-text text-transparent dark:via-white'
                : undefined
            }
          >
            {label}
          </motion.span>
        </AnimatePresence>

        {isThinkingOnly && elapsedSeconds > 0 && (
          <span className="text-muted-foreground/50 tabular-nums">
            {elapsedSeconds}s
          </span>
        )}

        {hasExpandableContent && (
          <ChevronDown
            className={cn(
              'size-3 transition-transform duration-300',
              isOpen ? 'rotate-180' : '',
            )}
          />
        )}
      </div>

      {isThinkingOnly && thinkingSnippet && (
        <AnimatePresence mode="wait">
          <motion.p
            key={thinkingSnippet}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] text-muted-foreground italic pl-8"
          >
            {thinkingSnippet}
          </motion.p>
        </AnimatePresence>
      )}

      <AnimatePresence initial={false}>
        {isOpen && hasExpandableContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.25, ease: 'easeInOut' },
            }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pl-4 pb-1">
              {steps.map((step, i) => (
                <motion.div
                  key={`${step.chipLabel}-${i}`}
                  initial={{ opacity: 0, x: -8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: i * 0.08,
                    ease: 'easeOut',
                  }}
                >
                  <StepChip
                    step={step}
                    isLast={i === steps.length - 1}
                    isStreaming={isStreaming}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepChip({
  step,
  isLast,
  isStreaming,
}: {
  step: ActivityStep;
  isLast: boolean;
  isStreaming: boolean;
}) {
  const isRunning = isLast && isStreaming;

  return (
    <div className="space-y-1.5">
      {!isRunning && step.summary && (
        <p className="text-xs text-muted-foreground/80">{step.summary}</p>
      )}
      <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{step.chipLabel}</span>
        {step.pieceNames.length > 0 && (
          <div className="flex items-center gap-0.5">
            {step.pieceNames.map((name) => (
              <PieceIconWithPieceName
                key={name}
                pieceName={normalizePieceName(name)}
                size="xs"
                border={false}
                showTooltip={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupIntoSteps(parts: DynamicToolPart[]): ActivityStep[] {
  if (parts.length === 0) return [];

  const groups: Array<{ action: string; tools: DynamicToolPart[] }> = [];
  let currentAction = '';
  let currentTools: DynamicToolPart[] = [];

  for (const part of parts) {
    const action = classifyTool(part);
    if (action !== currentAction && currentTools.length > 0) {
      groups.push({ action: currentAction, tools: [...currentTools] });
      currentTools = [];
    }
    currentAction = action;
    currentTools.push(part);
  }
  if (currentTools.length > 0) {
    groups.push({ action: currentAction, tools: currentTools });
  }

  return groups.map((group) => buildStep(group));
}

function classifyTool(part: DynamicToolPart): string {
  const name = (part.title ?? part.toolName).toLowerCase();
  if (name.includes('list_pieces') || name.includes('get_piece_props'))
    return 'explore';
  if (name.includes('list_connections') || name.includes('resolve_property'))
    return 'connections';
  if (name.includes('list_across_projects')) return 'connections';
  if (
    name.includes('create_flow') ||
    name.includes('build_flow') ||
    name.includes('add_step') ||
    name.includes('update_trigger') ||
    name.includes('update_step')
  )
    return 'build';
  if (name.includes('validate')) return 'validate';
  if (name.includes('test')) return 'test';
  if (name.includes('list_flows') || name.includes('flow_structure'))
    return 'flows';
  if (name.includes('list_runs') || name.includes('get_run')) return 'runs';
  if (
    name.includes('list_tables') ||
    name.includes('find_records') ||
    name.includes('create_table') ||
    name.includes('insert_records') ||
    name.includes('manage_fields')
  )
    return 'data';
  if (name.includes('lock_and_publish') || name.includes('change_flow_status'))
    return 'publish';
  if (name.includes('run_action') || name.includes('run_one_time'))
    return 'execute';
  if (name.includes('setup_guide')) return 'setup';
  if (name.includes('rename_flow') || name.includes('duplicate_flow'))
    return 'flows';
  if (
    name.includes('add_branch') ||
    name.includes('update_branch') ||
    name.includes('delete_branch') ||
    name.includes('delete_step')
  )
    return 'build';
  return 'explore';
}

function extractAllPieceNames(tools: DynamicToolPart[]): string[] {
  const names = new Set<string>();
  for (const tool of tools) {
    const input = isObject(tool.input) ? tool.input : undefined;
    if (input && typeof input.pieceName === 'string') {
      names.add(shortPieceName(input.pieceName));
    }
    if (
      input &&
      isObject(input.settings) &&
      typeof input.settings.pieceName === 'string'
    ) {
      names.add(shortPieceName(input.settings.pieceName));
    }
    if (tool.state === 'output-available' && isObject(tool.output)) {
      const output = tool.output as Record<string, unknown>;
      if (Array.isArray(output.pieces)) {
        for (const p of output.pieces.slice(0, 4)) {
          if (isObject(p) && typeof p.name === 'string') {
            names.add(shortPieceName(p.name));
          }
        }
      }
      if (Array.isArray(output.data)) {
        for (const item of output.data.slice(0, 5)) {
          if (isObject(item) && typeof item.pieceName === 'string') {
            names.add(shortPieceName(item.pieceName));
          }
        }
      }
    }
  }
  return [...names].slice(0, 5);
}

function shortPieceName(name: string): string {
  return name.replace(/^@activepieces\/piece-/, '');
}

function countResults(tools: DynamicToolPart[]): number {
  for (const tool of tools) {
    if (tool.state !== 'output-available' || !isObject(tool.output)) continue;
    const output = tool.output as Record<string, unknown>;
    if (Array.isArray(output.data)) return output.data.length;
    if (Array.isArray(output.pieces)) return output.pieces.length;
    if (Array.isArray(output.connections)) return output.connections.length;
  }
  return 0;
}

function buildStep({
  action,
  tools,
}: {
  action: string;
  tools: DynamicToolPart[];
}): ActivityStep {
  const pieceNames = extractAllPieceNames(tools);
  const count = countResults(tools);

  switch (action) {
    case 'explore': {
      const chipLabel =
        count > 0
          ? t('foundIntegrations', { count })
          : t('Searching integrations');
      return {
        summary:
          count > 0
            ? t('Found the right tools for your task.')
            : t('Searched available integrations.'),
        chipLabel,
        pieceNames,
      };
    }
    case 'connections': {
      const chipLabel =
        count > 0
          ? t('foundAccounts', { count })
          : pieceNames.length > 0
          ? t('Finding {name} accounts', { name: pieceNames[0] })
          : t('Checking accounts');
      return {
        summary:
          count > 0
            ? t('Located your accounts.')
            : t('Checked available connections.'),
        chipLabel,
        pieceNames,
      };
    }
    case 'build':
      return {
        summary: t('Built your automation steps.'),
        chipLabel:
          pieceNames.length > 0
            ? t('Configuring {name}', { name: pieceNames.join(', ') })
            : t('Creating flow'),
        pieceNames,
      };
    case 'validate':
      return {
        summary: t('Validated the flow configuration.'),
        chipLabel: t('Running checks'),
        pieceNames: [],
      };
    case 'test':
      return {
        summary: t('Ran tests on your flow.'),
        chipLabel: t('Running tests'),
        pieceNames,
      };
    case 'flows':
      return {
        summary: t('Reviewed your existing flows.'),
        chipLabel: count > 0 ? t('foundFlows', { count }) : t('Listing flows'),
        pieceNames: [],
      };
    case 'data':
      return {
        summary: t('Queried your tables.'),
        chipLabel:
          count > 0 ? t('foundRecords', { count }) : t('Searching records'),
        pieceNames: [],
      };
    case 'publish':
      return {
        summary: t('Published your flow.'),
        chipLabel: t('Publishing'),
        pieceNames: [],
      };
    case 'execute':
      return {
        summary: t('Executed the action.'),
        chipLabel:
          pieceNames.length > 0
            ? t('Running {name}', { name: pieceNames[0] })
            : t('Executing'),
        pieceNames,
      };
    case 'runs':
      return {
        summary: t('Checked your recent runs.'),
        chipLabel: t('Reviewing runs'),
        pieceNames: [],
      };
    case 'setup':
      return {
        summary: t('Found setup instructions.'),
        chipLabel: t('Getting setup guide'),
        pieceNames: [],
      };
    default:
      return {
        summary: t('Completed a step.'),
        chipLabel: t('Searching integrations'),
        pieceNames,
      };
  }
}

function useElapsedTimer(isActive: boolean): number {
  const startRef = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isActive) {
      startRef.current = startRef.current ?? Date.now();
      const interval = setInterval(() => {
        if (startRef.current) {
          setSeconds(
            Math.max(1, Math.floor((Date.now() - startRef.current) / 1000)),
          );
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    startRef.current = null;
    setSeconds(0);
    return undefined;
  }, [isActive]);

  return seconds;
}

const SNIPPET_PREFIXES = [
  /^the user\b/i,
  /^i need to\b/i,
  /^i should\b/i,
  /^i('ll|'ve| will| have| can| want| am)\b/i,
  /^let me\b/i,
  /^(?:okay|alright|hmm|wait),?\s*/i,
  /^(?:now|first|next|so),?\s*/i,
];

function useReasoningSnippet(
  reasoningText: string,
  isActive: boolean,
): string | null {
  const [snippet, setSnippet] = useState<string | null>(null);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!isActive || !reasoningText) {
      setSnippet(null);
      lastLengthRef.current = 0;
      return;
    }
    if (reasoningText.length <= lastLengthRef.current + 20) return;
    lastLengthRef.current = reasoningText.length;

    const sentences = reasoningText
      .split(/[.\n]/)
      .filter((s) => s.trim().length > 8);
    const latest = sentences[sentences.length - 1];
    if (!latest) return;

    let cleaned = latest.trim();
    for (const prefix of SNIPPET_PREFIXES) {
      cleaned = cleaned.replace(prefix, '');
    }
    cleaned = cleaned.trim();
    if (cleaned.length < 6) return;

    const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    const maxLen = 50;
    if (capitalized.length <= maxLen) {
      setSnippet(capitalized + '...');
    } else {
      const lastSpace = capitalized.lastIndexOf(' ', maxLen);
      setSnippet(
        (lastSpace > 15
          ? capitalized.slice(0, lastSpace)
          : capitalized.slice(0, maxLen)) + '...',
      );
    }
  }, [reasoningText, isActive]);

  return snippet;
}

type ActivityStep = {
  summary: string;
  chipLabel: string;
  pieceNames: string[];
};
