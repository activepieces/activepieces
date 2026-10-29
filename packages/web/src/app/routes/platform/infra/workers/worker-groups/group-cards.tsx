import { WorkerGroupSummary, WorkerGroupsOverview } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Layers, LucideIcon, Workflow } from 'lucide-react';
import React, { useLayoutEffect, useRef, useState } from 'react';

import { StatusDot, adminSurface } from '@/app/components/admin';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { groupUtils } from './hooks';

export function GroupCards({
  overview,
  onOpen,
  onAdd,
}: {
  overview: WorkerGroupsOverview | undefined;
  onOpen: (key: string) => void;
  onAdd: (group: WorkerGroupSummary) => void;
}) {
  if (!overview) {
    return (
      <GroupSection kind="project">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-50.5 rounded-xl" />
        ))}
      </GroupSection>
    );
  }
  const groups = [...overview.groups].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const flowGroups = groups.filter((g) => g.scope === 'flow');
  const projectGroups = groups.filter((g) => g.scope !== 'flow');
  const card = (group: WorkerGroupSummary) => (
    <GroupCard
      key={`${group.scope}:${group.label}`}
      group={group}
      onOpen={() =>
        onOpen(groupUtils.urlKey({ label: group.label, scope: group.scope }))
      }
      onAdd={() => onAdd(group)}
    />
  );
  return (
    <div className="flex flex-col gap-8">
      <GroupSection kind="project">
        <SharedCard
          overview={overview}
          onOpen={() =>
            onOpen(groupUtils.urlKey({ label: null, scope: 'project' }))
          }
        />
        {projectGroups.map(card)}
      </GroupSection>
      {flowGroups.length > 0 && (
        <GroupSection kind="flow">{flowGroups.map(card)}</GroupSection>
      )}
    </div>
  );
}

function GroupSection({
  kind,
  children,
}: {
  kind: 'project' | 'flow';
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-gray-12">
          {kind === 'flow' ? t('Flow groups') : t('Project groups')}
        </h2>
        <p className="text-sm text-gray-11">
          {kind === 'flow'
            ? t(
                'Only the flows picked here run on these servers. Their projects stay where they are.',
              )
            : t(
                'Each project here runs with all its flows, unless a flow has its own group.',
              )}
        </p>
      </div>
      <div className={GRID}>{children}</div>
    </section>
  );
}

function GroupCard({
  group,
  onOpen,
  onAdd,
}: {
  group: WorkerGroupSummary;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const forFlows = group.scope === 'flow';
  const count = forFlows ? group.flowCount : group.projectCount;
  return (
    <CardFrame
      onOpen={onOpen}
      label={groupUtils.name(group.label)}
      footer={
        <CardFooter aside={<OpenHint />}>
          <span onClick={(e) => e.stopPropagation()}>
            <Button
              {...adminControl(AdminControl.WORKERS_ASSIGN_OPEN)}
              size="sm"
              variant="outline"
              onClick={onAdd}
            >
              {forFlows ? t('Add flows') : t('Add projects')}
            </Button>
          </span>
        </CardFooter>
      }
    >
      <CardHeader name={groupUtils.name(group.label)} />
      <CardStatus
        online={group.online}
        slots={group.slots}
        waiting={group.waiting}
        inUse={groupUtils.inUse(group)}
      />
      <RunsHere
        icon={forFlows ? Workflow : Layers}
        names={group.sample}
        label={
          forFlows
            ? t('{count, plural, =1 {1 flow} other {{countText} flows}}', {
                count,
                countText: groupUtils.compact(count),
              })
            : t(
                '{count, plural, =1 {1 project} other {{countText} projects}}',
                { count, countText: groupUtils.compact(count) },
              )
        }
        total={count}
        empty={count === 0}
      />
    </CardFrame>
  );
}

function SharedCard({
  overview,
  onOpen,
}: {
  overview: WorkerGroupsOverview;
  onOpen: () => void;
}) {
  const shared = overview.defaultGroup;
  return (
    <CardFrame
      onOpen={onOpen}
      label={groupUtils.name(null)}
      footer={
        <CardFooter>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {t('View projects')}
          </Button>
        </CardFooter>
      }
    >
      <CardHeader name={groupUtils.name(null)} />
      <CardStatus
        online={shared.online}
        slots={shared.slots}
        waiting={0}
        inUse
      />
      <RunsHere
        icon={Layers}
        names={shared.sample}
        label={t(
          '{count, plural, =1 {1 project} other {{countText} projects}}',
          {
            count: shared.projectCount,
            countText: groupUtils.compact(shared.projectCount),
          },
        )}
        note={t('not in a group')}
        total={shared.projectCount}
        empty={shared.projectCount === 0}
      />
    </CardFrame>
  );
}

function CardHeader({ name }: { name: string }) {
  return (
    <div className="flex h-7 items-center">
      <TextWithTooltip tooltipMessage={name}>
        <span className="text-base font-semibold text-gray-12">{name}</span>
      </TextWithTooltip>
    </div>
  );
}

function CardStatus({
  online,
  slots,
  waiting,
  inUse,
}: {
  online: number;
  slots: number;
  waiting: number;
  inUse: boolean;
}) {
  const down = online === 0 && inUse;
  const waitingText =
    waiting > 0
      ? t('{count, plural, =1 {1 run waiting} other {# runs waiting}}', {
          count: waiting,
        })
      : null;
  const headline =
    online > 0
      ? t('{count, plural, =1 {1 worker online} other {# workers online}}', {
          count: online,
        })
      : down
      ? t('No workers online')
      : t('Not in use');
  const detail =
    online > 0
      ? waitingText ??
        t('Concurrency {count, number}', {
          count: slots,
        })
      : down
      ? waitingText ?? t('No runs waiting')
      : t('No workers use this name');
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm">
      <span className={ROW_GLYPH}>
        <StatusDot
          tone={down ? 'danger' : online > 0 ? 'success' : 'neutral'}
        />
      </span>
      <span
        className={cn(
          'shrink-0 font-medium',
          down ? 'text-danger-11' : 'text-gray-12',
        )}
      >
        {headline}
      </span>
      <span
        className={cn(
          'min-w-0 truncate',
          down && waiting > 0 ? 'text-danger-11' : 'text-gray-11',
        )}
      >
        {detail}
      </span>
    </p>
  );
}

function RunsHere({
  icon: Icon,
  names,
  label,
  note,
  total,
  empty,
}: {
  icon: LucideIcon;
  names: string[];
  label: string;
  note?: string;
  total: number;
  empty: boolean;
}) {
  const glyph = (
    <span className={cn(ROW_GLYPH, 'text-gray-10')}>
      <Icon className="size-4" />
    </span>
  );
  if (empty) {
    return (
      <p className={cn(RUNS_ROW, 'text-gray-11')}>
        {glyph}
        {t('Nothing yet')}
      </p>
    );
  }
  return (
    <p className={RUNS_ROW}>
      {glyph}
      <span className="shrink-0 font-medium text-gray-12">{label}</span>
      {note ? (
        <span className="min-w-0 truncate text-gray-11">{note}</span>
      ) : (
        <WholeNames names={names} total={total} />
      )}
    </p>
  );
}

function WholeNames({ names, total }: { names: string[]; total: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(names.length);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setShown(fitNames({ el, names, total }));
    fit();
    let active = true;
    document.fonts.ready.then(() => active && fit()).catch(() => undefined);
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [names, total]);
  const visible = names.slice(0, shown);
  const more = total - visible.length;
  if (visible.length === 0)
    return <span ref={ref} className="min-w-0 flex-1" />;
  return (
    <span
      ref={ref}
      className="flex min-w-0 flex-1 gap-1 overflow-hidden whitespace-nowrap text-gray-11"
    >
      <span className="truncate">{visible.join(', ')}</span>
      {more > 0 && <span className="shrink-0">{moreText(more)}</span>}
    </span>
  );
}

function fitNames({
  el,
  names,
  total,
}: {
  el: HTMLElement;
  names: string[];
  total: number;
}) {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return names.length;
  const style = getComputedStyle(el);
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  for (let count = names.length; count > 0; count--) {
    const more = total - count;
    const extra =
      more > 0 ? context.measureText(moreText(more)).width + NAMES_GAP_PX : 0;
    if (
      context.measureText(names.slice(0, count).join(', ')).width + extra <=
      el.clientWidth
    )
      return count;
  }
  return 0;
}

function moreText(count: number) {
  return t('+{count, number} more', { count });
}

function CardFooter({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mt-auto flex h-14 items-center justify-between gap-3 border-t px-5">
      {children}
      {aside}
    </div>
  );
}

function OpenHint() {
  return (
    <span className="flex shrink-0 items-center gap-0.5 text-sm text-gray-11 group-hover/card:text-gray-12">
      {t('Open')}
      <ChevronRight className="size-4" />
    </span>
  );
}

function CardFrame({
  onOpen,
  label,
  footer,
  children,
}: {
  onOpen: () => void;
  label: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={t('Open {group}', { group: label })}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) onOpen();
      }}
      className={cn(
        adminSurface.card,
        'group/card flex min-w-0 cursor-pointer flex-col gap-4 overflow-hidden pt-5 outline-none transition-[border-color,box-shadow] hover:border-gray-8 hover:shadow-sm focus-visible:border-gray-8 focus-visible:ring-[3px] focus-visible:ring-gray-8/50',
      )}
    >
      <div className="flex min-w-0 flex-col gap-4 px-5">{children}</div>
      {footer}
    </div>
  );
}

const GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,max(21rem,calc((100%_-_2rem)/3))),1fr))] gap-4';
const NAMES_GAP_PX = 4;
const RUNS_ROW = 'flex h-7 min-w-0 items-center gap-2 text-sm';
const ROW_GLYPH = 'flex w-4 shrink-0 justify-center';
