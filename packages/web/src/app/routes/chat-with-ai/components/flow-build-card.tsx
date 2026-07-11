import { BuildPlanStep } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  Rocket,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ReactNode, useId, useState } from 'react';

import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { Markdown } from '@/components/prompt-kit/markdown';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { markdownPreviewComponents } from './previews/markdown-preview-components';
import { usePieceTagPlugins } from './previews/piece-tag';

const CARD_BASE = 'bg-[#f9f7f2] dark:bg-[#1e1b18]';

export function FlowBuildCard({
  buildId,
  onSendPrompt,
  isStreaming,
  activity,
}: {
  buildId: string;
  onSendPrompt?: (text: string) => void;
  isStreaming?: boolean;
  activity?: ReactNode;
}) {
  const build = useChatStoreContext((s) =>
    chatStoreSelectors.buildById({ state: s, buildId }),
  );
  const reduceMotion = useReducedMotion();
  const isDone = build?.phase === 'done';
  const isFailed = build?.phase === 'failed';
  const thinkingDone = isDone || isFailed || !isStreaming;
  const [detailsOpen, setDetailsOpen] = useState(() => !thinkingDone);
  const [prevThinkingDone, setPrevThinkingDone] = useState(thinkingDone);
  const [justCompleted, setJustCompleted] = useState(false);
  const [prevDone, setPrevDone] = useState(isDone);
  if (thinkingDone !== prevThinkingDone) {
    setPrevThinkingDone(thinkingDone);
    if (thinkingDone) {
      setDetailsOpen(false);
    }
  }
  if (isDone !== prevDone) {
    setPrevDone(isDone);
    if (isDone) {
      // celebration ring fires only when a live build completes, never on history mounts
      setJustCompleted(true);
    }
  }

  if (!build) return activity ? <>{activity}</> : null;

  const total = build.steps.length;
  const done = build.steps.filter((s) => s.status === 'done').length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  const doneRun = countLeadingDone(build.steps);
  const spineProgress = total > 1 ? Math.max(0, doneRun - 1) / (total - 1) : 0;
  const isActive = !isDone && !isFailed;
  // a live build never shows a dead-empty bar, and done always lands on full
  const displayPercentage = isDone
    ? 100
    : isActive
    ? Math.max(percentage, 4)
    : percentage;
  const projectId = build.projectId ?? authenticationSession.getProjectId();
  const tagline = build.tagline ?? t('Less busywork, coming right up');
  const iconName = build.iconName ?? 'sparkles';
  const hasActions = isDone && build.flowId && projectId;

  return (
    <motion.div
      className={cn(
        'relative my-2 rounded-2xl border border-foreground/[0.07]',
        CARD_BASE,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {justCompleted && !reduceMotion && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-emerald-500/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, times: [0, 0.2, 1], ease: 'easeOut' }}
          />
          <CompletionBurst />
        </>
      )}
      <div
        className={cn(
          'relative z-10 rounded-t-2xl px-4 pb-3.5 pt-4 sm:px-5',
          isActive && 'sticky top-0',
          CARD_BASE,
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-t-2xl bg-[radial-gradient(circle,#a89f92_1px,transparent_1px)] opacity-[0.22] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent)] dark:bg-[radial-gradient(circle,#ffffff_1px,transparent_1px)] dark:opacity-[0.09]"
        />
        <BuildDoodle
          iconName={iconName}
          buildId={buildId}
          settled={!isActive}
        />
        <h2 className="relative pr-28 font-sentient text-2xl font-bold leading-[1.25] text-balance text-foreground sm:pr-40 sm:text-[28px]">
          {tagline}
        </h2>
        <div className="relative mt-3.5 flex items-center gap-2.5">
          <Progress
            value={displayPercentage}
            className="h-1.5 flex-1 bg-foreground/[0.06]"
            indicatorClassName={cn(
              'transition-all duration-700 [transition-timing-function:cubic-bezier(0.35,0,0.25,1)]',
              isActive &&
                !reduceMotion &&
                'animate-[shimmer_2.4s_linear_infinite] bg-[linear-gradient(90deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] bg-[length:200%_100%]',
              isDone && 'bg-emerald-500',
              isFailed && 'bg-amber-500',
            )}
          />
          {!isDone && total > 0 && (
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {done}/{total}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 sm:px-5">
        {build.outcome && <BuildOutcome outcome={build.outcome} />}
        <div className="relative">
          {total > 1 && (
            <>
              <div
                aria-hidden="true"
                className="absolute bottom-[9px] left-[8.5px] top-[9px] w-px bg-foreground/[0.08]"
              />
              <div
                aria-hidden="true"
                className="absolute left-[8.5px] top-[9px] w-px bg-emerald-500/60 transition-[height] duration-700 [transition-timing-function:cubic-bezier(0.35,0,0.25,1)]"
                style={{
                  height: `calc((100% - 18px) * ${spineProgress})`,
                }}
              />
            </>
          )}
          <ul className="space-y-2.5">
            {build.steps.map((step) => (
              <BuildStepRow key={step.id} step={step} />
            ))}
          </ul>
        </div>
      </div>

      {(activity || hasActions) && (
        <div className="mx-4 space-y-3 border-t border-foreground/[0.07] pb-5 pt-4 sm:mx-5">
          {activity && (
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              {thinkingDone && (
                <CollapsibleTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <span>{t('How I built this')}</span>
                  <ChevronDown
                    className={cn(
                      'size-3.5 shrink-0 opacity-50 transition-transform duration-300',
                      detailsOpen && 'rotate-180',
                    )}
                  />
                </CollapsibleTrigger>
              )}
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
                <div className={cn('min-w-0', thinkingDone && 'mt-2')}>
                  {activity}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {isDone && build.flowId && projectId && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium shadow-none"
                onClick={() =>
                  onSendPrompt?.(
                    t('Publish and enable the automation so it runs live'),
                  )
                }
                disabled={!onSendPrompt}
              >
                <Rocket className="h-3.5 w-3.5" />
                {t('Enable')}
              </Button>
              <OpenInBuilderButton
                projectId={projectId}
                flowId={build.flowId}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function BuildOutcome({ outcome }: { outcome: string }) {
  const piecePlugins = usePieceTagPlugins();
  return (
    <div className="mb-4 mt-3 max-w-[60ch] text-pretty text-foreground/75 [&_strong]:font-semibold [&_strong]:text-foreground">
      <Markdown
        className="text-base"
        components={markdownPreviewComponents}
        rehypePlugins={piecePlugins ?? []}
      >
        {outcome}
      </Markdown>
    </div>
  );
}

function OpenInBuilderButton({
  projectId,
  flowId,
}: {
  projectId: string;
  flowId: string;
}) {
  const openNewWindow = useNewWindow();
  const stage = useStageOptional();
  const openInBuilder = () => {
    if (stage) {
      stage.open({ type: 'flow', id: flowId });
    } else {
      openNewWindow(`/projects/${projectId}/flows/${flowId}`);
    }
  };
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 gap-1.5 rounded-lg border border-foreground/15 bg-foreground/[0.04] px-3 text-xs font-medium text-foreground shadow-none transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
      onClick={openInBuilder}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {t('Open in builder')}
    </Button>
  );
}

function countLeadingDone(steps: BuildPlanStep[]): number {
  let count = 0;
  for (const step of steps) {
    if (step.status !== 'done') break;
    count += 1;
  }
  return count;
}

// deterministic burst in the doodle's ink palette; fired once when a live build completes
const BURST_PARTICLES = [
  { dx: -78, dy: -64, w: 8, h: 3, rot: -120, delay: 0, color: '#8142E3' },
  { dx: -30, dy: -88, w: 5, h: 5, rot: 0, delay: 0.02, color: '#10b981' },
  { dx: 26, dy: -74, w: 8, h: 3, rot: 140, delay: 0.04, color: '#c2734f' },
  { dx: 58, dy: -42, w: 5, h: 5, rot: 0, delay: 0.01, color: '#5b8c84' },
  { dx: -96, dy: -18, w: 5, h: 5, rot: 0, delay: 0.05, color: '#b8893a' },
  { dx: -56, dy: -92, w: 8, h: 3, rot: 200, delay: 0.08, color: '#10b981' },
  { dx: 6, dy: -98, w: 5, h: 5, rot: 0, delay: 0.06, color: '#8142E3' },
  { dx: 44, dy: -86, w: 5, h: 5, rot: 0, delay: 0.1, color: '#b8893a' },
  { dx: -104, dy: -48, w: 8, h: 3, rot: -160, delay: 0.03, color: '#5b8c84' },
  { dx: 66, dy: -12, w: 8, h: 3, rot: 90, delay: 0.07, color: '#8142E3' },
  { dx: -20, dy: -60, w: 4, h: 4, rot: 0, delay: 0.12, color: '#c2734f' },
  { dx: -70, dy: 6, w: 4, h: 4, rot: 0, delay: 0.09, color: '#10b981' },
  { dx: 30, dy: -30, w: 4, h: 4, rot: 0, delay: 0.14, color: '#5b8c84' },
  { dx: -44, dy: -36, w: 8, h: 3, rot: 160, delay: 0.11, color: '#b8893a' },
  { dx: 14, dy: 12, w: 4, h: 4, rot: 0, delay: 0.05, color: '#c2734f' },
  { dx: -8, dy: -44, w: 5, h: 5, rot: 0, delay: 0, color: '#8142E3' },
];

function CompletionBurst() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-14 top-9 z-30 sm:right-24"
    >
      {BURST_PARTICLES.map((particle, idx) => (
        <motion.span
          key={idx}
          className="absolute rounded-full"
          style={{
            width: particle.w,
            height: particle.h,
            backgroundColor: particle.color,
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: particle.dx,
            y: particle.dy,
            scale: 1,
            rotate: particle.rot,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.05,
            delay: particle.delay,
            ease: [0.16, 1, 0.3, 1],
            opacity: {
              duration: 1.05,
              times: [0, 0.55, 1],
              delay: particle.delay,
            },
          }}
        />
      ))}
    </div>
  );
}

function BuildStepRow({ step }: { step: BuildPlanStep }) {
  return (
    <li className="flex items-center gap-3 text-base">
      <BuildStepMarker status={step.status} />
      {step.status === 'in_progress' ? (
        <TextShimmer duration={2.4} className="truncate">
          {step.label}
        </TextShimmer>
      ) : (
        <span
          className={cn(
            'truncate',
            step.status === 'done' && 'text-foreground',
            step.status === 'pending' && 'text-muted-foreground/80',
            step.status === 'failed' && 'text-amber-600 dark:text-amber-400',
          )}
        >
          {step.label}
        </span>
      )}
    </li>
  );
}

const MARKER_BASE =
  'relative flex size-[18px] shrink-0 items-center justify-center rounded-full';

function BuildStepMarker({ status }: { status: BuildPlanStep['status'] }) {
  const reduceMotion = useReducedMotion();
  switch (status) {
    case 'done':
      return (
        <motion.span
          className={cn(MARKER_BASE, 'bg-emerald-500')}
          initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Check className="size-3 text-white" strokeWidth={3.5} />
        </motion.span>
      );
    case 'in_progress':
      return (
        <span className={cn(MARKER_BASE, CARD_BASE)}>
          <Loader2
            className="size-[18px] animate-spin text-primary"
            strokeWidth={2.25}
          />
        </span>
      );
    case 'failed':
      return (
        <span className={cn(MARKER_BASE, 'bg-amber-500')}>
          <X className="size-3 text-white" strokeWidth={3.5} />
        </span>
      );
    case 'pending':
    default:
      return (
        <span
          className={cn(
            MARKER_BASE,
            CARD_BASE,
            'border-[1.5px] border-foreground/20',
          )}
        />
      );
  }
}

type DoodlePart =
  | { k: 'p'; d: string; w?: number; a?: boolean }
  | { k: 'd'; cx: number; cy: number; r: number; a?: boolean };

type DoodleScene = { m: string; a: string; parts: DoodlePart[] };

const DOODLE_SCENES: Record<string, DoodleScene> = {
  mail: {
    m: '#6b5b73',
    a: '#c2734f',
    parts: [
      {
        k: 'p',
        d: 'M22 42 Q22 38 26 38 L74 38 Q78 38 78 70 Q78 74 74 74 L26 74 Q22 74 22 70 Z',
        w: 2.4,
      },
      { k: 'p', d: 'M23 41 L50 58 L77 41', w: 2.4 },
      {
        k: 'p',
        d: 'M40 33 L40 24 Q40 22 42 22 L58 22 Q60 22 60 24 L60 35',
        w: 2,
      },
      { k: 'p', d: 'M45 28 H55', w: 1.8 },
      { k: 'p', d: 'M45 32 H53', w: 1.8 },
      { k: 'p', d: 'M8 49 H17', w: 2, a: true },
      { k: 'p', d: 'M6 57 H15', w: 2, a: true },
      { k: 'p', d: 'M10 64 H17', w: 2, a: true },
      { k: 'd', cx: 85, cy: 30, r: 1.8, a: true },
      { k: 'd', cx: 90, cy: 40, r: 1.4, a: true },
    ],
  },
  money: {
    m: '#b8893a',
    a: '#5b8c84',
    parts: [
      { k: 'p', d: 'M50 28 A22 22 0 1 1 49.9 28', w: 2.4 },
      { k: 'p', d: 'M50 36 L50 60', w: 2.2 },
      {
        k: 'p',
        d: 'M58 43 Q58 39 50 39 Q43 39 43 45 Q43 50 50 50 Q57 50 57 56 Q57 61 50 61 Q43 61 43 57',
        w: 2.2,
      },
      { k: 'p', d: 'M76 20 L76 13', w: 2, a: true },
      { k: 'p', d: 'M80 25 L86 21', w: 2, a: true },
      { k: 'p', d: 'M70 17 L74 13', w: 2, a: true },
      { k: 'd', cx: 86, cy: 54, r: 2.2, a: true },
      { k: 'd', cx: 16, cy: 42, r: 1.8, a: true },
    ],
  },
  time: {
    m: '#566275',
    a: '#b8893a',
    parts: [
      { k: 'p', d: 'M50 26 A24 24 0 1 1 49.9 26', w: 2.4 },
      { k: 'p', d: 'M50 31 V35', w: 1.6 },
      { k: 'p', d: 'M70 50 H66', w: 1.6 },
      { k: 'p', d: 'M50 70 V66', w: 1.6 },
      { k: 'p', d: 'M30 50 H34', w: 1.6 },
      { k: 'p', d: 'M50 50 L50 37', w: 2.2 },
      { k: 'p', d: 'M50 50 L61 56', w: 2.2 },
      { k: 'p', d: 'M40 73 L36 81', w: 2 },
      { k: 'p', d: 'M60 73 L64 81', w: 2 },
      { k: 'p', d: 'M72 22 Q80 26 79 33', w: 2, a: true },
      { k: 'd', cx: 79, cy: 33, r: 2, a: true },
    ],
  },
  chat: {
    m: '#5f7e9b',
    a: '#c2734f',
    parts: [
      {
        k: 'p',
        d: 'M20 34 Q20 28 26 28 L58 28 Q64 28 64 34 L64 48 Q64 54 58 54 L38 54 L28 63 L30 54 Q20 54 20 48 Z',
        w: 2.3,
      },
      { k: 'd', cx: 32, cy: 41, r: 1.9 },
      { k: 'd', cx: 40, cy: 41, r: 1.9 },
      { k: 'd', cx: 48, cy: 41, r: 1.9 },
      {
        k: 'p',
        d: 'M60 50 Q60 46 64 46 L80 46 Q84 46 84 60 Q84 64 80 64 L74 64 L68 71 L69 64 Q60 64 60 60 Z',
        w: 2.1,
        a: true,
      },
      {
        k: 'p',
        d: 'M70 22 Q72 18 75 21 Q78 18 80 22 Q80 27 75 30 Q70 27 70 22 Z',
        w: 2,
        a: true,
      },
    ],
  },
  chart: {
    m: '#4f8079',
    a: '#b8893a',
    parts: [
      { k: 'p', d: 'M24 22 L24 76 L82 76', w: 2.4 },
      { k: 'p', d: 'M34 76 V58 L44 58 L44 76', w: 2.2 },
      { k: 'p', d: 'M52 76 V46 L62 46 L62 76', w: 2.2 },
      { k: 'p', d: 'M70 76 V36 L80 36 L80 76', w: 2.2 },
      { k: 'p', d: 'M30 60 L46 50 L58 54 L80 30', w: 2.4, a: true },
      { k: 'p', d: 'M80 30 L72 30 M80 30 L80 38', w: 2.4, a: true },
      { k: 'd', cx: 40, cy: 20, r: 1.8, a: true },
    ],
  },
  funnel: {
    m: '#7a5c86',
    a: '#5b8c84',
    parts: [
      {
        k: 'p',
        d: 'M22 32 Q21 30 24 30 L76 30 Q79 30 77 32 L56 54 Q55 55 55 57 L55 70 Q55 73 52 70 L46 65 Q45 64 45 62 L45 56 Q45 55 44 54 L23 32 Z',
        w: 2.4,
      },
      { k: 'd', cx: 34, cy: 22, r: 3, a: true },
      { k: 'd', cx: 50, cy: 18, r: 3, a: true },
      { k: 'd', cx: 66, cy: 22, r: 3, a: true },
      { k: 'p', d: 'M50 72 L50 80', w: 2.2, a: true },
      { k: 'd', cx: 50, cy: 84, r: 2, a: true },
    ],
  },
  squiggle: {
    m: '#8a6f93',
    a: '#5b8c84',
    parts: [
      {
        k: 'p',
        d: 'M16 52 C26 38 32 56 42 48 C52 40 54 58 64 50 C72 44 74 52 84 46',
        w: 2.4,
      },
      { k: 'p', d: 'M20 66 Q30 60 40 66 T60 66 T80 66', w: 2, a: true },
      { k: 'd', cx: 30, cy: 30, r: 2, a: true },
      { k: 'd', cx: 70, cy: 30, r: 2, a: true },
      { k: 'd', cx: 50, cy: 24, r: 1.6, a: true },
    ],
  },
  doc: {
    m: '#566275',
    a: '#c2734f',
    parts: [
      { k: 'p', d: 'M30 18 L58 18 L72 32 L72 82 L30 82 Z', w: 2.4 },
      { k: 'p', d: 'M58 18 L58 32 L72 32', w: 2 },
      { k: 'p', d: 'M38 46 H64', w: 1.8 },
      { k: 'p', d: 'M38 55 H64', w: 1.8 },
      { k: 'p', d: 'M38 64 H54', w: 1.8 },
      { k: 'p', d: 'M84 22 L84 14 M80 18 L88 18', w: 1.8, a: true },
      { k: 'd', cx: 18, cy: 58, r: 1.8, a: true },
      { k: 'd', cx: 16, cy: 48, r: 1.4, a: true },
    ],
  },
  bell: {
    m: '#b8893a',
    a: '#5f7e9b',
    parts: [
      {
        k: 'p',
        d: 'M50 22 Q66 22 66 44 Q66 56 72 62 L28 62 Q34 56 34 44 Q34 22 50 22 Z',
        w: 2.4,
      },
      { k: 'p', d: 'M43 62 Q43 71 50 71 Q57 71 57 62', w: 2.2 },
      { k: 'd', cx: 50, cy: 19, r: 2.4 },
      { k: 'p', d: 'M74 32 Q80 38 78 46', w: 2, a: true },
      { k: 'p', d: 'M26 32 Q20 38 22 46', w: 2, a: true },
      { k: 'd', cx: 84, cy: 24, r: 1.6, a: true },
    ],
  },
  bot: {
    m: '#5f7e9b',
    a: '#c2734f',
    parts: [
      {
        k: 'p',
        d: 'M32 34 Q32 30 36 30 L64 30 Q68 30 68 34 L68 58 Q68 62 64 62 L36 62 Q32 62 32 58 Z',
        w: 2.4,
      },
      { k: 'p', d: 'M50 30 L50 22', w: 2 },
      { k: 'd', cx: 50, cy: 19, r: 2.2 },
      { k: 'd', cx: 42, cy: 44, r: 2.6 },
      { k: 'd', cx: 58, cy: 44, r: 2.6 },
      { k: 'p', d: 'M43 54 H57', w: 1.8 },
      { k: 'p', d: 'M32 44 L27 44', w: 2 },
      { k: 'p', d: 'M68 44 L73 44', w: 2 },
      { k: 'p', d: 'M82 28 L82 20 M78 24 L86 24', w: 1.8, a: true },
      { k: 'd', cx: 18, cy: 54, r: 1.6, a: true },
    ],
  },
  database: {
    m: '#4f8079',
    a: '#b8893a',
    parts: [
      {
        k: 'p',
        d: 'M30 30 Q30 24 50 24 Q70 24 70 30 Q70 36 50 36 Q30 36 30 30 Z',
        w: 2.2,
      },
      { k: 'p', d: 'M30 30 L30 58 Q30 64 50 64 Q70 64 70 58 L70 30', w: 2.2 },
      { k: 'p', d: 'M30 44 Q30 50 50 50 Q70 50 70 44', w: 2 },
      { k: 'p', d: 'M82 30 L82 22 M78 26 L86 26', w: 1.8, a: true },
      { k: 'd', cx: 18, cy: 40, r: 1.6, a: true },
      { k: 'd', cx: 84, cy: 52, r: 1.6, a: true },
    ],
  },
  cloud: {
    m: '#5b8c84',
    a: '#5f7e9b',
    parts: [
      {
        k: 'p',
        d: 'M36 62 Q24 62 24 52 Q24 42 36 42 Q36 30 50 30 Q63 30 65 42 Q76 42 76 53 Q76 62 66 62 Z',
        w: 2.4,
      },
      { k: 'p', d: 'M50 58 L50 44 M44 50 L50 44 L56 50', w: 2.2, a: true },
      { k: 'd', cx: 84, cy: 34, r: 1.6, a: true },
      { k: 'd', cx: 16, cy: 56, r: 1.6, a: true },
      { k: 'd', cx: 52, cy: 22, r: 1.4, a: true },
    ],
  },
  check: {
    m: '#4f8079',
    a: '#b8893a',
    parts: [
      {
        k: 'p',
        d: 'M30 30 Q30 26 34 26 L66 26 Q70 26 70 30 L70 70 Q70 74 66 74 L34 74 Q30 74 30 70 Z',
        w: 2.4,
      },
      { k: 'p', d: 'M40 50 L47 58 L62 40', w: 2.8, a: true },
      { k: 'p', d: 'M80 30 L80 22 M76 26 L84 26', w: 1.8, a: true },
      { k: 'd', cx: 18, cy: 60, r: 1.6, a: true },
    ],
  },
  people: {
    m: '#7a5c86',
    a: '#5b8c84',
    parts: [
      { k: 'p', d: 'M40 30 A7 7 0 1 1 39.9 30', w: 2.2 },
      { k: 'p', d: 'M27 60 Q27 47 40 47 Q53 47 53 60', w: 2.2 },
      { k: 'p', d: 'M62 32 A6 6 0 1 1 61.9 32', w: 2, a: true },
      { k: 'p', d: 'M52 60 Q52 49 62 49 Q72 49 72 60', w: 2, a: true },
      { k: 'd', cx: 84, cy: 34, r: 1.6, a: true },
      { k: 'd', cx: 16, cy: 34, r: 1.6, a: true },
    ],
  },
  tag: {
    m: '#c2734f',
    a: '#5b8c84',
    parts: [
      {
        k: 'p',
        d: 'M20 50 L36 34 Q38 32 41 32 L76 32 Q80 32 80 36 L80 64 Q80 68 76 68 L41 68 Q38 68 36 66 L20 50 Z',
        w: 2.4,
      },
      { k: 'p', d: 'M48 46 A4 4 0 1 1 47.9 46', w: 2 },
      { k: 'p', d: 'M20 50 Q12 46 14 40', w: 2, a: true },
      { k: 'd', cx: 84, cy: 26, r: 1.6, a: true },
      { k: 'd', cx: 86, cy: 56, r: 1.4, a: true },
    ],
  },
  gear: {
    m: '#566275',
    a: '#b8893a',
    parts: [
      { k: 'p', d: 'M50 28 A22 22 0 1 1 49.9 28', w: 2.4 },
      { k: 'p', d: 'M50 42 A8 8 0 1 1 49.9 42', w: 2 },
      { k: 'p', d: 'M50 24 L50 16', w: 2.2, a: true },
      { k: 'p', d: 'M50 76 L50 84', w: 2.2, a: true },
      { k: 'p', d: 'M76 50 L84 50', w: 2.2, a: true },
      { k: 'p', d: 'M24 50 L16 50', w: 2.2, a: true },
      { k: 'p', d: 'M68 32 L74 26', w: 2, a: true },
      { k: 'p', d: 'M32 68 L26 74', w: 2, a: true },
    ],
  },
  shield: {
    m: '#5f7e9b',
    a: '#4f8079',
    parts: [
      {
        k: 'p',
        d: 'M50 20 L74 28 Q74 30 74 34 Q74 58 50 78 Q26 58 26 34 Q26 30 26 28 Z',
        w: 2.4,
      },
      { k: 'p', d: 'M40 46 L48 54 L62 38', w: 2.6, a: true },
      { k: 'd', cx: 84, cy: 26, r: 1.6, a: true },
      { k: 'd', cx: 16, cy: 26, r: 1.6, a: true },
    ],
  },
  rocket: {
    m: '#c2734f',
    a: '#b8893a',
    parts: [
      { k: 'p', d: 'M50 18 Q61 30 59 52 L41 52 Q39 30 50 18 Z', w: 2.4 },
      { k: 'p', d: 'M50 32 A4.5 4.5 0 1 1 49.9 32', w: 2 },
      { k: 'p', d: 'M41 48 L31 62 L43 56', w: 2.2 },
      { k: 'p', d: 'M59 48 L69 62 L57 56', w: 2.2 },
      { k: 'p', d: 'M46 54 Q50 66 54 54', w: 2.2, a: true },
      { k: 'd', cx: 50, cy: 74, r: 2, a: true },
      { k: 'd', cx: 80, cy: 26, r: 1.6, a: true },
      { k: 'd', cx: 22, cy: 30, r: 1.4, a: true },
    ],
  },
  box: {
    m: '#8a6f93',
    a: '#b8893a',
    parts: [
      { k: 'p', d: 'M28 40 L50 30 L72 40 L72 66 L50 76 L28 66 Z', w: 2.4 },
      { k: 'p', d: 'M28 40 L50 50 L72 40', w: 2.2 },
      { k: 'p', d: 'M50 50 L50 76', w: 2.2 },
      { k: 'p', d: 'M50 30 L50 50', w: 2, a: true },
      { k: 'p', d: 'M82 34 L82 26 M78 30 L86 30', w: 1.8, a: true },
      { k: 'd', cx: 18, cy: 56, r: 1.6, a: true },
    ],
  },
  globe: {
    m: '#4f8079',
    a: '#c2734f',
    parts: [
      { k: 'p', d: 'M50 26 A24 24 0 1 1 49.9 26', w: 2.4 },
      { k: 'p', d: 'M26 50 H74', w: 1.8 },
      { k: 'p', d: 'M50 26 L50 74', w: 1.6 },
      { k: 'p', d: 'M31 37 Q50 46 69 37', w: 1.6, a: true },
      { k: 'p', d: 'M31 63 Q50 54 69 63', w: 1.6, a: true },
      { k: 'p', d: 'M50 26 Q34 50 50 74', w: 1.6, a: true },
      { k: 'p', d: 'M50 26 Q66 50 50 74', w: 1.6, a: true },
      { k: 'd', cx: 86, cy: 30, r: 1.6, a: true },
    ],
  },
};

const ICON_TO_MOTIF: Record<string, keyof typeof DOODLE_SCENES> = {
  mail: 'mail',
  send: 'mail',
  'message-square': 'chat',
  'message-circle': 'chat',
  phone: 'chat',
  smartphone: 'chat',
  mic: 'chat',
  'dollar-sign': 'money',
  'credit-card': 'money',
  calendar: 'time',
  'calendar-clock': 'time',
  clock: 'time',
  sun: 'time',
  moon: 'time',
  'bar-chart': 'chart',
  'line-chart': 'chart',
  'pie-chart': 'chart',
  'trending-up': 'chart',
  filter: 'funnel',
  search: 'funnel',
  user: 'people',
  users: 'people',
  'user-plus': 'people',
  smile: 'people',
  heart: 'people',
  'file-text': 'doc',
  file: 'doc',
  folder: 'doc',
  pencil: 'doc',
  image: 'doc',
  video: 'doc',
  bell: 'bell',
  'alert-triangle': 'bell',
  'alert-circle': 'bell',
  info: 'bell',
  bot: 'bot',
  sparkles: 'bot',
  zap: 'bot',
  database: 'database',
  server: 'database',
  table: 'database',
  cloud: 'cloud',
  upload: 'cloud',
  download: 'cloud',
  check: 'check',
  'check-circle': 'check',
  x: 'check',
  'x-circle': 'check',
  circle: 'check',
  square: 'check',
  plus: 'check',
  minus: 'check',
  star: 'check',
  'thumbs-up': 'check',
  'thumbs-down': 'check',
  tag: 'tag',
  tags: 'tag',
  hash: 'tag',
  flag: 'tag',
  bookmark: 'tag',
  settings: 'gear',
  'sliders-horizontal': 'gear',
  repeat: 'gear',
  'refresh-cw': 'gear',
  play: 'gear',
  pause: 'gear',
  'trash-2': 'gear',
  shield: 'shield',
  lock: 'shield',
  key: 'shield',
  eye: 'shield',
  rocket: 'rocket',
  truck: 'box',
  package: 'box',
  gift: 'box',
  briefcase: 'box',
  globe: 'globe',
  link: 'globe',
  wifi: 'globe',
  'map-pin': 'globe',
  building: 'globe',
  home: 'globe',
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveDoodleScene({
  iconName,
  buildId,
}: {
  iconName: string;
  buildId: string;
}): DoodleScene {
  const mapped = DOODLE_SCENES[ICON_TO_MOTIF[iconName] ?? iconName];
  const keys = Object.keys(DOODLE_SCENES);
  return mapped ?? DOODLE_SCENES[keys[hashString(buildId) % keys.length]];
}

function BuildDoodle({
  iconName,
  buildId,
  settled,
}: {
  iconName: string;
  buildId: string;
  settled?: boolean;
}) {
  const reduce = useReducedMotion();
  const rawId = useId();
  const inkId = `ink-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const scene = resolveDoodleScene({ iconName, buildId });
  // once the build settles, the sketch rests fully drawn instead of looping forever
  const still = Boolean(reduce) || Boolean(settled);

  return (
    <div
      className="absolute right-4 top-0 z-20 size-[80px] -rotate-12 sm:right-10 sm:size-[104px]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" fill="none" className="h-full w-full">
        <defs>
          {/* faint static displacement → soft hand-inked quality, no jitter */}
          <filter
            id={inkId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.016"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.1"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <g filter={`url(#${inkId})`}>
          {scene.parts.map((part, idx) => {
            const color = part.a ? scene.a : scene.m;
            const fwd = idx % 2 === 0;
            const dur = 6.4 + (idx % 5) * 0.6;
            const begin = (idx * 0.35) % 2.4;
            if (part.k === 'p') {
              return (
                <path
                  key={idx}
                  d={part.d}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.9}
                  strokeWidth={part.w ?? 2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={still ? 0 : fwd ? 100 : 0}
                >
                  {!still && (
                    <animate
                      attributeName="stroke-dashoffset"
                      values={fwd ? '100;0;0;100' : '0;100;100;0'}
                      keyTimes="0;0.3;0.82;1"
                      dur={`${dur}s`}
                      begin={`${begin}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </path>
              );
            }
            return (
              <circle
                key={idx}
                cx={part.cx}
                cy={part.cy}
                r={part.r}
                fill={color}
                opacity={still ? 1 : fwd ? 0 : 1}
              >
                {!still && (
                  <animate
                    attributeName="opacity"
                    values={fwd ? '0;1;1;0' : '1;0;0;1'}
                    keyTimes="0;0.32;0.82;1"
                    dur={`${dur}s`}
                    begin={`${begin}s`}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
