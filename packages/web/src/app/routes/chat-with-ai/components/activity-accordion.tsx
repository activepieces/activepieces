import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import {
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Code,
  Compass,
  Copy,
  Eye,
  FileText,
  GitBranch,
  Hammer,
  Link,
  List,
  Loader2,
  Network,
  Pencil,
  Play,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  StickyNote,
  Table,
  ToggleRight,
  Trash2,
  Upload,
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

import { StreamingText } from './streaming-text';

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
      initial={isStreaming ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
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
          {isStreaming ? (
            <TextShimmer className="text-sm" duration={1.5}>
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

        <AnimatePresence>
          {!isOpen && isStreaming && lastStep && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <div className="pt-2">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`step-${lastStepIdx}`}
                    initial={{ opacity: 0, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(2px)' }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    <StepRenderer
                      step={lastStep}
                      showConnector={false}
                      isStreaming={true}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                showConnector={true}
                isStreaming={isStreaming}
              />
            ))}

            {!isStreaming && hasSteps && (
              <div className="flex gap-2.5 items-center py-1">
                <div className="flex items-center justify-center size-5 rounded-full bg-green-100 dark:bg-green-500/20">
                  <Check className="size-2.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {t('Done')}
                </span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function StepRenderer({
  step,
  showConnector,
  isStreaming,
}: {
  step: ThinkingStep;
  showConnector: boolean;
  isStreaming: boolean;
}) {
  switch (step.kind) {
    case 'reasoning':
      return (
        <StepRow icon={Brain} showConnector={showConnector}>
          {isStreaming ? (
            <StreamingText
              text={step.text}
              isStreaming={true}
              className="whitespace-pre-wrap break-words text-xs text-muted-foreground leading-relaxed"
            />
          ) : (
            <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground leading-relaxed">
              {step.text}
            </p>
          )}
        </StepRow>
      );
    case 'thinking-status':
      return (
        <StepRow icon={Clock} showConnector={showConnector}>
          {isStreaming ? (
            <StreamingText
              text={step.text}
              isStreaming={true}
              className="text-xs text-muted-foreground"
            />
          ) : (
            <p className="text-xs text-muted-foreground">{step.text}</p>
          )}
        </StepRow>
      );
    case 'tool':
      return (
        <ToolStepCard
          part={step.part}
          description={step.description}
          showConnector={showConnector}
          isStreaming={isStreaming}
        />
      );
  }
}

function StepRow({
  icon: Icon,
  showConnector,
  children,
}: {
  icon: React.FC<{ className?: string }>;
  showConnector: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center justify-center size-5 rounded-full bg-muted">
          <Icon className="size-2.5 text-muted-foreground" />
        </div>
        {showConnector && <div className="w-px flex-1 bg-border min-h-2" />}
      </div>
      <div className="flex-1 min-w-0 pb-2 pt-0.5">{children}</div>
    </div>
  );
}

function ToolStepCard({
  part,
  description,
  showConnector,
  isStreaming,
}: {
  part: AnyToolPart;
  description: string | null;
  showConnector: boolean;
  isStreaming: boolean;
}) {
  const status = chatPartUtils.deriveToolStatus(part);
  const StatusIcon =
    status === 'running'
      ? Loader2
      : status === 'failed'
      ? XCircle
      : status === 'completed'
      ? Check
      : Wrench;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const rawInput = isObject(part.input) ? part.input : undefined;
  const input = useMemo(() => {
    if (!rawInput) return undefined;
    const { title: _t, description: _d, ...rest } = rawInput;
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
  const pieceNames = useMemo(
    () => chatPartUtils.extractPieceNames(rawInput),
    [rawInput],
  );
  const { summaries: pieceSummaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const summary = useMemo(() => buildToolSummary({ part }), [part]);
  const primaryPiece = pieceSummaries.find((p) => p.logoUrl);
  const resolvedDescription =
    description ??
    (rawInput &&
    typeof rawInput.description === 'string' &&
    rawInput.description
      ? rawInput.description
      : null);

  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div
          className={cn(
            'flex items-center justify-center size-5 rounded-full',
            status === 'completed' && 'bg-green-100 dark:bg-green-500/20',
            status === 'failed' && 'bg-destructive/10',
            status === 'running' && 'bg-primary/10',
            status === 'stopped' && 'bg-muted',
          )}
        >
          <StatusIcon
            className={cn(
              'size-2.5',
              status === 'completed' && 'text-green-600 dark:text-green-400',
              status === 'failed' && 'text-destructive',
              status === 'running' && 'text-primary animate-spin',
              status === 'stopped' && 'text-muted-foreground',
            )}
          />
        </div>
        {showConnector && <div className="w-px flex-1 bg-border min-h-2" />}
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <div
            className={cn(
              'rounded-lg border bg-card px-3 py-2',
              hasDetails &&
                'cursor-pointer hover:bg-muted/40 transition-colors',
            )}
            onClick={() => hasDetails && setDetailsOpen(!detailsOpen)}
          >
            <div className="flex items-center gap-2">
              {primaryPiece ? (
                <PieceIcon
                  displayName={primaryPiece.displayName}
                  logoUrl={primaryPiece.logoUrl!}
                  size="xxs"
                  border={false}
                  showTooltip={false}
                />
              ) : (
                <summary.icon className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground flex-1 truncate">
                {summary.label}
              </span>
              {hasDetails && (
                <ChevronDown
                  className={cn(
                    'size-3 shrink-0 text-muted-foreground/40 transition-transform',
                    detailsOpen && 'rotate-180',
                  )}
                />
              )}
            </div>
            {resolvedDescription && (
              <div className="mt-1">
                {isStreaming && status === 'running' ? (
                  <StreamingText
                    text={resolvedDescription}
                    isStreaming={true}
                    className="text-xs text-muted-foreground"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {resolvedDescription}
                  </p>
                )}
              </div>
            )}
          </div>
          {hasDetails && (
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="mt-1 rounded-lg border bg-muted/30 px-3 py-2 space-y-2 text-[11px]">
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
    </div>
  );
}

const TOOL_ICON_KEYWORDS: Array<{
  pattern: RegExp;
  icon: React.FC<{ className?: string }>;
}> = [
  { pattern: /table|field|record/i, icon: Table },
  { pattern: /note|annotation|memo/i, icon: StickyNote },
  { pattern: /branch|router/i, icon: GitBranch },
  { pattern: /code|script/i, icon: Code },
  { pattern: /structure|schema/i, icon: Network },
  { pattern: /publish|deploy|release|lock_and/i, icon: Upload },
  { pattern: /retry|repeat/i, icon: RefreshCw },
  { pattern: /duplicate|copy|clone/i, icon: Copy },
  { pattern: /rename/i, icon: Pencil },
  { pattern: /research|discover|piece/i, icon: Compass },
  { pattern: /setup|guide|help/i, icon: BookOpen },
  { pattern: /status|toggle|enable|disable/i, icon: ToggleRight },
  { pattern: /validate|check|verify|lint/i, icon: ShieldCheck },
  { pattern: /test/i, icon: Play },
  { pattern: /build|create|add|new|insert/i, icon: Hammer },
  { pattern: /update|edit|modify|patch|fix|manage/i, icon: Pencil },
  { pattern: /delete|remove|drop/i, icon: Trash2 },
  { pattern: /get|read|fetch|inspect/i, icon: Eye },
  { pattern: /list|find|query|browse/i, icon: List },
  { pattern: /run|execute|trigger/i, icon: Play },
  { pattern: /search|resolve/i, icon: Search },
  { pattern: /send|notify|email|message|post/i, icon: Send },
  { pattern: /connect|link|auth|oauth/i, icon: Link },
  { pattern: /config|setting|option|preference/i, icon: Settings },
  { pattern: /doc|file|page|sheet|report/i, icon: FileText },
];

function resolveToolIcon(
  toolName: string,
  label: string,
): React.FC<{ className?: string }> {
  if (toolName === 'ap_execute_action') return Zap;
  const searchText = `${toolName} ${label}`;
  for (const entry of TOOL_ICON_KEYWORDS) {
    if (entry.pattern.test(searchText)) return entry.icon;
  }
  return Wrench;
}

function buildToolSummary({ part }: { part: AnyToolPart }): {
  icon: React.FC<{ className?: string }>;
  label: string;
} {
  const toolName = chatPartUtils.getToolPartName(part);
  const label = chatUtils.formatToolActionName({ part });
  const icon = resolveToolIcon(toolName, label);
  return { icon, label };
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
