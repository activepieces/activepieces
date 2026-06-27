import { BuildPlanStep } from '@activepieces/shared';
import { t } from 'i18next';
import {
  AlertCircle,
  Check,
  Circle,
  ExternalLink,
  Loader2,
  Rocket,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ReactNode, useId } from 'react';

import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

const CARD_BASE = 'bg-[#f9f7f2] dark:bg-[#1e1b18]';

export function FlowBuildCard({
  buildId,
  onSendPrompt,
  activity,
}: {
  buildId: string;
  onSendPrompt?: (text: string) => void;
  activity?: ReactNode;
}) {
  const build = useChatStoreContext((s) =>
    chatStoreSelectors.buildById({ state: s, buildId }),
  );

  if (!build) return activity ? <>{activity}</> : null;

  const total = build.steps.length;
  const done = build.steps.filter((s) => s.status === 'done').length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  const isDone = build.phase === 'done';
  const isFailed = build.phase === 'failed';
  const projectId = build.projectId ?? authenticationSession.getProjectId();
  const tagline = build.tagline ?? t('Less busywork, coming right up');
  const iconName = build.iconName ?? 'sparkles';
  const hasActions = isDone && build.flowId && projectId;

  return (
    <motion.div
      className={cn('relative my-2 rounded-2xl', CARD_BASE)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          'relative z-10 rounded-t-2xl px-4 pb-3 pt-4 sm:px-5',
          !isDone && !isFailed && 'sticky top-0',
          CARD_BASE,
        )}
      >
        <BuildDoodle iconName={iconName} />
        <h2 className="pr-28 text-2xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:pr-40 sm:text-[28px]">
          {tagline}
        </h2>
        <Progress
          value={percentage}
          className="mt-3 h-2"
          indicatorClassName={cn(
            'transition-all duration-500 ease-out',
            isDone && 'bg-emerald-500',
            isFailed && 'bg-amber-500',
          )}
        />
      </div>

      <div className="px-4 pb-4 pt-1 sm:px-5">
        <ul className="space-y-2.5">
          {build.steps.map((step) => (
            <BuildStepRow key={step.id} step={step} />
          ))}
        </ul>
      </div>

      {(activity || hasActions) && (
        <div className="mx-5 space-y-3 border-t border-foreground/[0.07] pb-5 pt-4">
          {activity && <div className="min-w-0">{activity}</div>}

          {isDone && build.flowId && projectId && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 rounded-lg border border-foreground/15 bg-foreground/[0.04] px-3 text-xs font-medium text-foreground shadow-none transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
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
      className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      onClick={openInBuilder}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {t('Open in builder')}
    </Button>
  );
}

function BuildStepRow({ step }: { step: BuildPlanStep }) {
  return (
    <li className="flex items-center gap-3 text-base">
      <BuildStepIcon status={step.status} />
      <span
        className={cn(
          'truncate',
          step.status === 'done' && 'text-foreground',
          step.status === 'pending' && 'text-muted-foreground',
          step.status === 'in_progress' && 'font-medium text-foreground',
          step.status === 'failed' && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {step.label}
      </span>
    </li>
  );
}

function BuildStepIcon({ status }: { status: BuildPlanStep['status'] }) {
  switch (status) {
    case 'done':
      return <Check className="h-[18px] w-[18px] shrink-0 text-emerald-500" />;
    case 'in_progress':
      return (
        <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin text-primary" />
      );
    case 'failed':
      return (
        <AlertCircle className="h-[18px] w-[18px] shrink-0 text-amber-500" />
      );
    case 'pending':
    default:
      return (
        <Circle className="h-[18px] w-[18px] shrink-0 text-muted-foreground/40" />
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
};

const ICON_TO_MOTIF: Record<string, keyof typeof DOODLE_SCENES> = {
  mail: 'mail',
  send: 'mail',
  'message-square': 'chat',
  'message-circle': 'chat',
  'dollar-sign': 'money',
  'credit-card': 'money',
  calendar: 'time',
  'calendar-clock': 'time',
  clock: 'time',
  'bar-chart': 'chart',
  'line-chart': 'chart',
  'pie-chart': 'chart',
  'trending-up': 'chart',
  filter: 'funnel',
  users: 'funnel',
  user: 'funnel',
  'user-plus': 'funnel',
};

function BuildDoodle({ iconName }: { iconName: string }) {
  const reduce = useReducedMotion();
  const rawId = useId();
  const inkId = `ink-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const scene =
    DOODLE_SCENES[ICON_TO_MOTIF[iconName] ?? iconName] ??
    DOODLE_SCENES.squiggle;

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
                  strokeDashoffset={reduce ? 0 : fwd ? 100 : 0}
                >
                  {!reduce && (
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
                opacity={reduce ? 1 : fwd ? 0 : 1}
              >
                {!reduce && (
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
