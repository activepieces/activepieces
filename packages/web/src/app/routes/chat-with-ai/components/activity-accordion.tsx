import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { DynamicToolPart } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';

const HIDDEN_TOOL_NAMES = new Set([
  'ap_set_session_title',
  'ap_select_project',
  'ap_deselect_project',
]);

export function ThinkingBlock({
  toolParts,
  reasoningText,
  isStreaming,
}: {
  toolParts: DynamicToolPart[];
  reasoningText: string;
  isStreaming: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const visibleParts = useMemo(
    () => toolParts.filter((p) => !HIDDEN_TOOL_NAMES.has(p.toolName)),
    [toolParts],
  );

  const steps = useMemo(() => groupIntoSteps(visibleParts), [visibleParts]);

  const hasReasoning = reasoningText.length > 0;
  const hasVisibleParts = visibleParts.length > 0;
  const currentStep = useMemo(() => {
    if (!isStreaming) return null;
    if (steps.length > 0) return steps[steps.length - 1];
    return null;
  }, [isStreaming, steps]);

  if (!hasVisibleParts && !hasReasoning && !isStreaming) return null;

  const doneLabel =
    visibleParts.length > 0
      ? t('stepsCompleted', { count: steps.length })
      : t('Thought for a few seconds');
  const collapsedLabel = isStreaming ? null : doneLabel;

  const hasExpandableContent = hasReasoning || steps.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          disabled={!hasExpandableContent}
          className={cn(
            'flex flex-col gap-0.5 text-sm text-muted-foreground text-left',
            hasExpandableContent &&
              'hover:text-foreground transition-colors cursor-pointer',
          )}
        >
          <div className="flex items-center gap-1">
            {isStreaming ? (
              <TextShimmer className="text-sm" duration={3}>
                {t('Thinking...')}
              </TextShimmer>
            ) : (
              <span>{collapsedLabel}</span>
            )}
            {hasExpandableContent && (
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 transition-transform duration-300',
                  isOpen && 'rotate-180',
                )}
              />
            )}
          </div>
        </CollapsibleTrigger>

        {isStreaming && currentStep && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStep.action}-${currentStep.chipLabel}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="mt-1 space-y-0.5"
            >
              <p className="text-xs text-muted-foreground">
                {currentStep.summary}
              </p>
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2.5 py-1 text-xs">
                <TextShimmer className="text-xs" duration={3}>
                  {currentStep.chipLabel}
                </TextShimmer>
                {currentStep.pieceNames.length > 0 && (
                  <div className="flex items-center gap-0.5">
                    {currentStep.pieceNames.map((name) => (
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
            </motion.div>
          </AnimatePresence>
        )}

        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="mt-1.5 space-y-1.5">
            {hasReasoning && <ReasoningBlock text={reasoningText} />}
            {steps.map((step, i) => (
              <StepRow key={`${step.action}-${i}`} step={step} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function ReasoningBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const truncateLength = 180;
  const isTruncatable = text.length > truncateLength;
  const displayText =
    expanded || !isTruncatable ? text : text.slice(0, truncateLength) + '...';

  return (
    <div className="text-xs text-muted-foreground/80 py-1">
      <p className="whitespace-pre-wrap break-words">{displayText}</p>
      {isTruncatable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-primary text-xs mt-0.5 hover:underline"
        >
          {expanded ? t('Show less') : t('Show more')}
        </button>
      )}
    </div>
  );
}

function StepRow({ step }: { step: ToolStep }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{step.summary}</p>
      <div className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
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

function groupIntoSteps(parts: DynamicToolPart[]): ToolStep[] {
  if (parts.length === 0) return [];

  const groups: Array<{ action: string; tools: DynamicToolPart[] }> = [];
  let currentAction = '';
  let currentTools: DynamicToolPart[] = [];

  for (const part of parts) {
    const action = classifyToolAction(part);
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

  return groups.map((g) => buildStep(g));
}

function classifyToolAction(part: DynamicToolPart): string {
  const name = (part.title ?? part.toolName).toLowerCase();
  if (name.includes('list_pieces') || name.includes('list_across_projects'))
    return 'discover';
  if (name.includes('list_connections')) return 'connections';
  if (name.includes('create_flow') || name.includes('build_flow'))
    return 'create';
  if (
    name.includes('validate') ||
    name.includes('test') ||
    name.includes('update_trigger') ||
    name.includes('update_step') ||
    name.includes('add_step') ||
    name.includes('resolve_property') ||
    name.includes('get_piece_props')
  )
    return 'build';
  if (name.includes('lock_and_publish') || name.includes('change_flow_status'))
    return 'publish';
  if (name.includes('manage_notes')) return 'notes';
  if (name.includes('list_flows') || name.includes('flow_structure'))
    return 'flows';
  if (name.includes('list_runs') || name.includes('get_run')) return 'runs';
  if (name.includes('run_action') || name.includes('run_one_time'))
    return 'execute';
  return 'other';
}

function buildStep({
  action,
  tools,
}: {
  action: string;
  tools: DynamicToolPart[];
}): ToolStep {
  const allPieceNames = collectPieceNames(tools);
  const done = tools.every((t) => t.state === 'output-available');
  const friendlyNames = allPieceNames
    .map((n) => chatUtils.humanizePieceName(n))
    .join(', ');

  switch (action) {
    case 'discover':
      return {
        action,
        summary: done
          ? t('Found the right tools for your task.')
          : t('Looking for the right tools...'),
        chipLabel: friendlyNames
          ? t('Checked {name}', { name: friendlyNames })
          : t('Checked integrations'),
        pieceNames: allPieceNames,
      };
    case 'connections':
      return {
        action,
        summary: done
          ? friendlyNames
            ? t('Located your {name} account.', { name: friendlyNames })
            : t('Located your accounts.')
          : friendlyNames
          ? t('Looking for your {name} account...', {
              name: friendlyNames,
            })
          : t('Looking for your accounts...'),
        chipLabel: friendlyNames
          ? t('Found {name} accounts', { name: friendlyNames })
          : t('Found accounts'),
        pieceNames: allPieceNames,
      };
    case 'create':
      return {
        action,
        summary: done
          ? t('Started building your automation.')
          : t('Creating your automation...'),
        chipLabel: t('Created flow'),
        pieceNames: allPieceNames,
      };
    case 'build':
      return {
        action,
        summary: done
          ? friendlyNames
            ? t('Set up the {name} step.', { name: friendlyNames })
            : t('Added a step to your flow.')
          : friendlyNames
          ? t('Setting up {name}...', { name: friendlyNames })
          : t('Adding a step to your flow...'),
        chipLabel: friendlyNames
          ? t('Configured {name}', { name: friendlyNames })
          : t('Configured steps'),
        pieceNames: allPieceNames,
      };
    case 'publish':
      return {
        action,
        summary: done
          ? t('Turned on your automation.')
          : t('Turning on your automation...'),
        chipLabel: t('Published flow'),
        pieceNames: [],
      };
    case 'notes':
      return {
        action,
        summary: done
          ? t('Added notes to your flow.')
          : t('Adding notes to your flow...'),
        chipLabel: t('Added notes'),
        pieceNames: [],
      };
    case 'flows':
      return {
        action,
        summary: done
          ? t('Looked at your existing automations.')
          : t('Looking at your automations...'),
        chipLabel: t('Reviewed flows'),
        pieceNames: [],
      };
    case 'runs':
      return {
        action,
        summary: done
          ? t('Checked your recent activity.')
          : t('Checking your recent activity...'),
        chipLabel: t('Checked runs'),
        pieceNames: [],
      };
    case 'execute':
      return {
        action,
        summary: done
          ? friendlyNames
            ? t('Ran a {name} action.', { name: friendlyNames })
            : t('Ran an action for you.')
          : friendlyNames
          ? t('Running {name}...', { name: friendlyNames })
          : t('Running an action...'),
        chipLabel: friendlyNames
          ? t('Ran {name}', { name: friendlyNames })
          : t('Ran action'),
        pieceNames: allPieceNames,
      };
    default:
      return {
        action,
        summary: done ? t('Completed a step.') : t('Working...'),
        chipLabel: t('Completed step'),
        pieceNames: allPieceNames,
      };
  }
}

function collectPieceNames(tools: DynamicToolPart[]): string[] {
  const names = new Set<string>();
  for (const tool of tools) {
    const input = isObject(tool.input) ? tool.input : undefined;
    if (input && typeof input.pieceName === 'string') {
      names.add(chatUtils.stripPiecePrefix(input.pieceName));
    }
    if (
      input &&
      isObject(input.settings) &&
      typeof input.settings.pieceName === 'string'
    ) {
      names.add(chatUtils.stripPiecePrefix(input.settings.pieceName));
    }
    if (tool.state === 'output-available' && isObject(tool.output)) {
      const output = tool.output;
      if (Array.isArray(output.pieces)) {
        for (const p of output.pieces.slice(0, 4)) {
          if (isObject(p) && typeof p.name === 'string') {
            names.add(chatUtils.stripPiecePrefix(p.name));
          }
        }
      }
      if (Array.isArray(output.data)) {
        for (const item of output.data.slice(0, 4)) {
          if (isObject(item) && typeof item.pieceName === 'string') {
            names.add(chatUtils.stripPiecePrefix(item.pieceName));
          }
        }
      }
    }
  }
  return [...names].slice(0, 5);
}

type ToolStep = {
  action: string;
  summary: string;
  chipLabel: string;
  pieceNames: string[];
};
