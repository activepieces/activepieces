import {
  WorkerGroupFlowAssignment,
  WorkerGroupProjectAssignment,
  WorkerGroupsOverview,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';

import { StatusDot, adminSurface } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { MoveItem, groupUtils, useMover, workerGroupsQueries } from './hooks';
import {
  FlowBadge,
  Hint,
  OffBadge,
  Pager,
  ProjectBadge,
  SearchBox,
  SelectionBar,
  WorkerGroupSelect,
} from './parts';
import { RunLimitButton } from './run-limit';

export function ProjectsTable({
  overview,
  label,
  search,
  onSearchChange,
  cursor,
  onCursorChange,
  onOpenFlows,
  emptyText,
  showRunLimit,
  showRemove = false,
}: {
  overview: WorkerGroupsOverview | undefined;
  label: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  cursor: string | undefined;
  onCursorChange: (cursor: string | undefined) => void;
  onOpenFlows: (project: WorkerGroupProjectAssignment) => void;
  emptyText: string;
  showRunLimit: boolean;
  showRemove?: boolean;
}) {
  const selection = useSelection('project');
  const query = workerGroupsQueries.useProjects({
    params: {
      ...groupUtils.projectListParams(label),
      search: search || undefined,
      cursor,
    },
  });
  const page = query.data;
  const topRef = useScrollTopOnPage(page?.offset);
  const columns = showRunLimit ? 6 : 5;
  const rows = page?.data ?? [];
  const groupSummary = groupUtils.find({
    overview,
    label,
    scope: 'project',
  });
  return (
    <div ref={topRef} className="flex scroll-mt-4 flex-col gap-3">
      <SearchBox
        value={search}
        onChange={onSearchChange}
        placeholder={t('Search projects')}
      />
      <Frame>
        <Table className="table-fixed max-md:w-[980px] [&_td:last-child]:pr-4 [&_th:last-child]:pr-4">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <PageCheckbox
                  selection={selection}
                  rows={rows.map(projectSelectable)}
                />
              </TableHead>
              <TableHead>{t('Project')}</TableHead>
              <TableHead className="w-16">{t('Flows')}</TableHead>
              <TableHead className="w-56">{t('Worker group')}</TableHead>
              {showRunLimit && (
                <TableHead className="w-48">
                  <Hint
                    text={t(
                      'The most runs of one project at the same time. Flows with their own group are not limited by it. Extra runs wait their turn.',
                    )}
                  >
                    <span>{t('Concurrency limit')}</span>
                  </Hint>
                </TableHead>
              )}
              <TableHead className={showRemove ? 'w-56' : 'w-36'} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isError && (
              <ErrorRow
                columns={columns}
                entity={t('projects')}
                onRetry={() => query.refetch()}
              />
            )}
            {query.isLoading && (
              <SkeletonRows
                columns={columns}
                rows={Math.min(
                  groupSummary?.projectCount ??
                    (label === null
                      ? overview?.defaultGroup.projectCount
                      : undefined) ??
                    SKELETON_ROWS,
                  SKELETON_ROWS,
                )}
              />
            )}
            {rows.map((row) => (
              <ProjectRow
                key={row.id}
                project={row}
                overview={overview}
                selected={selection.has(row.id)}
                onToggle={() => selection.toggle(projectSelectable(row))}
                onMoved={() => selection.drop(row.id)}
                showRunLimit={showRunLimit}
                showRemove={showRemove}
                onOpenFlows={onOpenFlows}
              />
            ))}
            {page && rows.length === 0 && (
              <EmptyRow
                columns={columns}
                text={search ? t('No projects match your search.') : emptyText}
              />
            )}
          </TableBody>
        </Table>
      </Frame>
      {page && (
        <Pager
          offset={page.offset}
          count={rows.length}
          total={page.total}
          onPrevious={
            page.previous !== null
              ? () => onCursorChange(page.previous ?? undefined)
              : undefined
          }
          onNext={
            page.next !== null
              ? () => onCursorChange(page.next ?? undefined)
              : undefined
          }
        />
      )}
      <SelectionBar
        items={selection.items}
        kind="project"
        overview={overview}
        onDone={selection.clear}
        selectAll={
          groupSummary && !search && page && page.total > rows.length
            ? {
                total: page.total,
                group: groupSummary,
                active: selection.all,
                onToggle: selection.selectAll,
              }
            : undefined
        }
      />
    </div>
  );
}

export function FlowsTable({
  overview,
  group,
  projectId,
  emptyText,
  scrollBody = false,
  footerAction,
  showRemove = false,
  expectedRows,
}: {
  overview: WorkerGroupsOverview | undefined;
  group?: string;
  projectId?: string;
  emptyText: string;
  scrollBody?: boolean;
  footerAction?: React.ReactNode;
  showRemove?: boolean;
  expectedRows?: number;
}) {
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const selection = useSelection('flow');
  const query = workerGroupsQueries.useFlows({
    params: { group, projectId, search: search || undefined, cursor },
  });
  const page = query.data;
  const showProject = projectId === undefined;
  const columns = (showProject ? 4 : 3) + (showRemove ? 1 : 0);
  const rows = page?.data ?? [];
  const groupSummary = groupUtils.find({
    overview,
    label: group ?? null,
    scope: 'flow',
  });
  return (
    <div className={cn('flex flex-col gap-3', scrollBody && 'min-h-0 flex-1')}>
      <SearchBox
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCursor(undefined);
        }}
        placeholder={t('Search flows')}
      />
      <div
        className={cn(
          scrollBody && 'min-h-0 flex-1 overflow-y-auto rounded-xl border-y',
        )}
      >
        <Frame>
          <Table
            className={cn(
              'table-fixed [&_td:last-child]:pr-4 [&_th:last-child]:pr-4',
              !scrollBody && 'max-md:w-[980px]',
            )}
          >
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <PageCheckbox
                    selection={selection}
                    rows={rows.map(flowSelectable)}
                  />
                </TableHead>
                <TableHead>{t('Flow')}</TableHead>
                {showProject && (
                  <TableHead className="w-56">{t('Project')}</TableHead>
                )}
                <TableHead
                  className={scrollBody ? 'w-72 max-sm:hidden' : 'w-56'}
                >
                  {t('Worker group')}
                </TableHead>
                {showRemove && <TableHead className="w-28" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isError && (
                <ErrorRow
                  columns={columns}
                  entity={t('flows')}
                  onRetry={() => query.refetch()}
                />
              )}
              {query.isLoading && (
                <SkeletonRows columns={columns} rows={expectedRows} />
              )}
              {rows.map((row) => (
                <FlowRow
                  key={row.id}
                  flow={row}
                  overview={overview}
                  selected={selection.has(row.id)}
                  onToggle={() => selection.toggle(flowSelectable(row))}
                  onMoved={() => selection.drop(row.id)}
                  showProject={showProject}
                  showRemove={showRemove}
                  stacked={scrollBody}
                />
              ))}
              {page && rows.length === 0 && (
                <EmptyRow
                  columns={columns}
                  text={search ? t('No flows match your search.') : emptyText}
                />
              )}
            </TableBody>
          </Table>
        </Frame>
      </div>
      {(page || footerAction) && (
        <div
          className={cn(
            'flex items-center gap-4',
            footerAction ? 'justify-between' : 'justify-end',
          )}
        >
          {page && (
            <Pager
              offset={page.offset}
              count={rows.length}
              total={page.total}
              noun={scrollBody ? t('flows') : undefined}
              onPrevious={
                page.previous !== null
                  ? () => setCursor(page.previous ?? undefined)
                  : undefined
              }
              onNext={
                page.next !== null
                  ? () => setCursor(page.next ?? undefined)
                  : undefined
              }
            />
          )}
          {footerAction}
        </div>
      )}
      <SelectionBar
        items={selection.items}
        kind="flow"
        overview={overview}
        inline={scrollBody}
        onDone={selection.clear}
        selectAll={
          groupSummary && !search && page && page.total > rows.length
            ? {
                total: page.total,
                group: groupSummary,
                active: selection.all,
                onToggle: selection.selectAll,
              }
            : undefined
        }
      />
    </div>
  );
}

export function ProjectRow({
  project,
  overview,
  selected,
  onToggle,
  onMoved,
  showRunLimit,
  showRemove,
  onOpenFlows,
}: {
  project: WorkerGroupProjectAssignment;
  overview: WorkerGroupsOverview | undefined;
  selected: boolean;
  onToggle: () => void;
  onMoved: () => void;
  showRunLimit: boolean;
  showRemove: boolean;
  onOpenFlows: (project: WorkerGroupProjectAssignment) => void;
}) {
  const { move } = useMover();
  const moveTo = (to: string | null) => {
    move({
      items: [{ kind: 'project', id: project.id, from: project.workerGroupId }],
      to,
    })
      .then((moved) => moved && onMoved())
      .catch(() => undefined);
  };
  return (
    <TableRow className="h-14 hover:bg-transparent">
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={t('Select {name}', { name: project.displayName })}
        />
      </TableCell>
      <TableCell>
        <span className="flex min-w-0 items-center gap-3">
          <ProjectBadge
            name={project.displayName}
            color={project.color}
            size="lg"
          />
          <span className="flex min-w-0 flex-col">
            <TextWithTooltip tooltipMessage={project.displayName}>
              <span className="font-medium text-gray-12">
                {project.displayName}
              </span>
            </TextWithTooltip>
            <PinnedFlowsLine overview={overview} project={project} />
          </span>
        </span>
      </TableCell>
      <TableCell className="tabular-nums text-gray-11">
        {project.flowCount}
      </TableCell>
      <TableCell>
        <WorkerGroupSelect
          kind="project"
          value={project.workerGroupId}
          overview={overview}
          subject={project.displayName}
          detail={projectDetail(project)}
          onChange={moveTo}
        />
      </TableCell>
      {showRunLimit && (
        <TableCell>
          <RunLimitButton project={project} />
        </TableCell>
      )}
      <TableCell>
        <span className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={project.flowCount === 0}
            onClick={() => onOpenFlows(project)}
          >
            {t('View flows')}
          </Button>
          {showRemove && project.workerGroupId !== null && (
            <Button variant="ghost" size="sm" onClick={() => moveTo(null)}>
              {t('Remove')}
            </Button>
          )}
        </span>
      </TableCell>
    </TableRow>
  );
}

export function FlowRow({
  flow,
  overview,
  selected,
  onToggle,
  onMoved,
  showProject,
  showRemove,
  stacked,
}: {
  flow: WorkerGroupFlowAssignment;
  overview: WorkerGroupsOverview | undefined;
  selected: boolean;
  onToggle: () => void;
  onMoved: () => void;
  showProject: boolean;
  showRemove: boolean;
  stacked: boolean;
}) {
  const { move } = useMover();
  const moveTo = (to: string | null) => {
    move({
      items: [{ kind: 'flow', id: flow.id, from: flow.workerGroupId }],
      to,
    })
      .then((moved) => moved && onMoved())
      .catch(() => undefined);
  };
  const picker = (
    <WorkerGroupSelect
      kind="flow"
      value={flow.workerGroupId}
      inherited={flow.inherited}
      overview={overview}
      subject={flow.displayName}
      align="end"
      onChange={moveTo}
    />
  );
  return (
    <TableRow className="h-14 hover:bg-transparent">
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={t('Select {name}', { name: flow.displayName })}
        />
      </TableCell>
      <TableCell>
        <span className="flex min-w-0 items-center gap-3">
          <span className={cn('shrink-0', stacked && 'max-sm:hidden')}>
            <FlowBadge size="lg" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex min-w-0 items-center gap-2">
              <TextWithTooltip tooltipMessage={flow.displayName}>
                <span
                  className={cn(
                    'font-medium',
                    flow.enabled ? 'text-gray-12' : 'text-gray-10',
                  )}
                >
                  {flow.displayName}
                </span>
              </TextWithTooltip>
              {!flow.enabled && <OffBadge />}
            </span>
            {stacked && <span className="sm:hidden">{picker}</span>}
          </span>
        </span>
      </TableCell>
      {showProject && (
        <TableCell>
          <span className="flex min-w-0 items-center gap-3 text-gray-11">
            <ProjectBadge
              name={flow.projectName}
              color={flow.projectColor}
              size="lg"
            />
            <span className="flex min-w-0 flex-col">
              <TextWithTooltip tooltipMessage={flow.projectName}>
                <span>{flow.projectName}</span>
              </TextWithTooltip>
            </span>
          </span>
        </TableCell>
      )}
      <TableCell className={cn(stacked && 'max-sm:hidden')}>{picker}</TableCell>
      {showRemove && (
        <TableCell className="text-right">
          {flow.workerGroupId !== null && (
            <Button variant="ghost" size="sm" onClick={() => moveTo(null)}>
              {t('Remove')}
            </Button>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(adminSurface.listFrame, 'overflow-x-auto')}>
      {children}
    </div>
  );
}

function projectSelectable(row: WorkerGroupProjectAssignment): SelectableRow {
  return {
    id: row.id,
    from: row.workerGroupId,
    flows: row.flowCount - row.flowsElsewhere,
  };
}

function flowSelectable(row: WorkerGroupFlowAssignment): SelectableRow {
  return { id: row.id, from: row.workerGroupId };
}

function PageCheckbox({
  selection,
  rows,
}: {
  selection: Selection;
  rows: SelectableRow[];
}) {
  const selectedOnPage = rows.filter((r) => selection.has(r.id)).length;
  const state =
    rows.length > 0 && selectedOnPage === rows.length
      ? true
      : selectedOnPage > 0
      ? 'indeterminate'
      : false;
  return (
    <Checkbox
      checked={state}
      disabled={rows.length === 0}
      onCheckedChange={() =>
        state === true ? selection.removePage(rows) : selection.addPage(rows)
      }
      aria-label={t('Select all on this page')}
    />
  );
}

function useSelection(kind: 'project' | 'flow'): Selection {
  const [items, setItems] = useState<MoveItem[]>([]);
  const [all, setAll] = useState(false);
  return {
    items,
    all,
    has: (id) => items.some((i) => i.id === id),
    toggle: ({ id, from, flows }) => {
      setAll(false);
      setItems((prev) =>
        prev.some((i) => i.id === id)
          ? prev.filter((i) => i.id !== id)
          : [...prev, { kind, id, from, flows }],
      );
    },
    addPage: (rows) => {
      setAll(false);
      const ids = new Set(rows.map((r) => r.id));
      setItems((prev) => [
        ...prev.filter((i) => !ids.has(i.id)),
        ...rows.map((r) => ({ kind, id: r.id, from: r.from, flows: r.flows })),
      ]);
    },
    removePage: (rows) => {
      setAll(false);
      const ids = new Set(rows.map((r) => r.id));
      setItems((prev) => prev.filter((i) => !ids.has(i.id)));
    },
    drop: (id) => {
      setAll(false);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    selectAll: () => setAll(true),
    clear: () => {
      setAll(false);
      setItems([]);
    },
  };
}

function PinnedFlowsLine({
  overview,
  project,
}: {
  overview: WorkerGroupsOverview | undefined;
  project: WorkerGroupProjectAssignment;
}) {
  if (project.pinnedFlows.length === 0) return null;
  const stuck = project.pinnedFlows.some(
    (p) =>
      groupUtils.find({
        overview,
        label: p.workerGroupId,
        scope: 'flow',
      })?.online === 0,
  );
  const text =
    project.pinnedFlows.length === 1
      ? t(
          '{count, plural, =1 {1 flow runs on {group}} other {# flows run on {group}}}',
          {
            count: project.pinnedFlows[0].count,
            group: groupUtils.name(project.pinnedFlows[0].workerGroupId),
          },
        )
      : t(
          '{count, plural, =1 {1 flow runs on another group} other {# flows run on other groups}}',
          {
            count: project.flowsElsewhere,
          },
        );
  const line = (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-gray-11">
      {stuck && <StatusDot tone="danger" />}
      <span className="truncate">{text}</span>
    </span>
  );
  if (project.pinnedFlows.length === 1 && !stuck) return line;
  return (
    <Hint
      text={project.pinnedFlows
        .map((p) =>
          groupUtils.find({
            overview,
            label: p.workerGroupId,
            scope: 'flow',
          })?.online === 0
            ? t(
                '{count, plural, =1 {1 flow} other {# flows}} on {group}, which has no workers online',
                {
                  count: p.count,
                  group: groupUtils.name(p.workerGroupId),
                },
              )
            : t('{count, plural, =1 {1 flow} other {# flows}} on {group}', {
                count: p.count,
                group: groupUtils.name(p.workerGroupId),
              }),
        )
        .join(' · ')}
    >
      {line}
    </Hint>
  );
}

function projectDetail(row: WorkerGroupProjectAssignment) {
  const moving = row.flowCount - row.flowsElsewhere;
  return row.flowsElsewhere > 0
    ? t(
        '{count, plural, =1 {1 flow moves} other {# flows move}}; {kept, plural, =1 {1 keeps its own group.} other {# keep their own group.}}',
        {
          count: moving,
          kept: row.flowsElsewhere,
        },
      )
    : t(
        '{count, plural, =1 {Its 1 flow moves too.} other {Its # flows move too.}}',
        { count: moving },
      );
}

function ErrorRow({
  columns,
  entity,
  onRetry,
}: {
  columns: number;
  entity: string;
  onRetry: () => void;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns}>
        <DataFetchErrorState entity={entity} onRetry={onRetry} />
      </TableCell>
    </TableRow>
  );
}

function SkeletonRows({
  columns,
  rows = SKELETON_ROWS,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <TableRow key={r} className="h-14 hover:bg-transparent">
          <TableCell>
            <Skeleton className="size-4 rounded" />
          </TableCell>
          <TableCell>
            <span className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-1/2" />
            </span>
          </TableCell>
          {Array.from({ length: columns - 2 }, (_, c) => (
            <TableCell key={c}>
              <Skeleton className="h-4 w-3/4" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyRow({ columns, text }: { columns: number; text: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns} className="h-24 text-center text-gray-10">
        {text}
      </TableCell>
    </TableRow>
  );
}

const SKELETON_ROWS = 10;

type Selection = {
  items: MoveItem[];
  all: boolean;
  has: (id: string) => boolean;
  toggle: (row: SelectableRow) => void;
  addPage: (rows: SelectableRow[]) => void;
  removePage: (rows: SelectableRow[]) => void;
  drop: (id: string) => void;
  selectAll: () => void;
  clear: () => void;
};

type SelectableRow = { id: string; from: string | null; flows?: number };

function useScrollTopOnPage(offset: number | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(offset);
  useEffect(() => {
    if (offset === undefined || previous.current === offset) return;
    const changed = previous.current !== undefined;
    previous.current = offset;
    const el = ref.current;
    if (changed && el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: 'start' });
    }
  }, [offset]);
  return ref;
}
