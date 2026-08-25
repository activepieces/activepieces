import { RunTimeline, TimelinePhase } from '@activepieces/shared';
import { t } from 'i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

const PHASE_COLOR: Record<TimelinePhase['name'], string> = {
  QUEUE: 'bg-blue-600',
  PROVISION: 'bg-amber-500',
  BOOT: 'bg-violet-600',
  RUN: 'bg-emerald-600',
};

function phaseLabel(name: TimelinePhase['name']): string {
  switch (name) {
    case 'QUEUE':
      return t('Queue');
    case 'PROVISION':
      return t('Setup');
    case 'BOOT':
      return t('Warm-up');
    case 'RUN':
      return t('Run');
  }
}

function phaseDescription(name: TimelinePhase['name']): string {
  switch (name) {
    case 'QUEUE':
      return t('Waiting for a free worker');
    case 'PROVISION':
      return t('Installing pieces & engine');
    case 'BOOT':
      return t('Starting the engine');
    case 'RUN':
      return t('Executing your flow');
  }
}

function LegBar({ phases }: { phases: TimelinePhase[] }) {
  const total = phases.reduce((sum, p) => sum + p.durationMs, 0);
  if (total === 0) return null;
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-md">
      {phases.map((phase) => {
        const pct = total > 0 ? (phase.durationMs / total) * 100 : 0;
        return (
          <Tooltip key={phase.name}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  PHASE_COLOR[phase.name],
                  'min-w-[3px]',
                  'cursor-default',
                )}
                style={{ width: `${pct}%` }}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              {phaseLabel(phase.name)}:{' '}
              {formatUtils.formatDuration(phase.durationMs, true)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function isTimelineEmpty(
  timeline: RunTimeline | null | undefined,
): boolean {
  if (!timeline || timeline.legs.length === 0) return true;
  return timeline.legs.every((leg) => leg.every((p) => p.durationMs === 0));
}

export function TimelineBar({
  timeline,
}: {
  timeline: RunTimeline | null | undefined;
}) {
  if (!timeline || isTimelineEmpty(timeline)) return null;

  const allPhaseNames: TimelinePhase['name'][] = [
    'QUEUE',
    'PROVISION',
    'BOOT',
    'RUN',
  ];
  const totals: Record<TimelinePhase['name'], number> = {
    QUEUE: 0,
    PROVISION: 0,
    BOOT: 0,
    RUN: 0,
  };
  for (const leg of timeline.legs) {
    for (const p of leg) {
      totals[p.name] += p.durationMs;
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2">
        {timeline.legs.map((leg, i) => (
          <div key={i} className="flex flex-col gap-2">
            {i > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 border-t border-dashed border-border" />
                <span>{t('Resumed')}</span>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>
            )}
            <LegBar phases={leg} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        {allPhaseNames.map((name) => (
          <div key={name} className="flex items-baseline gap-2">
            <span
              className={cn(
                'mt-1 inline-block size-2 shrink-0 rounded-full',
                PHASE_COLOR[name],
              )}
            />
            <span className="w-16 shrink-0 font-medium text-foreground">
              {phaseLabel(name)}
            </span>
            <span className="flex-1 text-muted-foreground">
              {phaseDescription(name)}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">
              {formatUtils.formatDuration(totals[name], true)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
