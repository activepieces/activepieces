import {
  WorkerGroupProjectAssignment,
  WorkerGroupsOverview,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

import { adminLayout, adminSurface } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import {
  MoveItem,
  PAGE_SIZE,
  groupUtils,
  useDebounced,
  useMover,
  workerGroupsQueries,
} from './hooks';
import { FlowBadge, OffBadge, ProjectBadge, SearchBox } from './parts';

export function AddItemsDialog({
  open,
  onOpenChange,
  overview,
  label,
  kind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overview: WorkerGroupsOverview | undefined;
  label: string;
  kind: 'project' | 'flow';
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={adminLayout.dialog.lg}>
        {open && (
          <AddItemsForm
            overview={overview}
            label={label}
            kind={kind}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddItemsForm({
  overview,
  label,
  kind,
  onDone,
}: {
  overview: WorkerGroupsOverview | undefined;
  label: string;
  kind: 'project' | 'flow';
  onDone: () => void;
}) {
  const [search, setSearch] = useState('');
  const [project, setProject] = useState<WorkerGroupProjectAssignment | null>(
    null,
  );
  const [picked, setPicked] = useState<MoveItem[]>([]);
  const { move } = useMover();
  const [saving, setSaving] = useState(false);
  const query = useDebounced({ value: search.trim(), ms: SEARCH_DEBOUNCE_MS });
  const projects = workerGroupsQueries.useProjects({
    params: {
      filter: 'all',
      search: query || undefined,
      exclude: label,
    },
    enabled: kind === 'project',
  });
  const flows = workerGroupsQueries.useFlows({
    params: {
      limit: PAGE_SIZE,
      filter: 'all',
      projectId: project?.id,
      search: query || undefined,
      exclude: label,
    },
    enabled: kind === 'flow',
  });
  const group = groupUtils.find({ overview, label, scope: kind });
  const pageQuery = kind === 'project' ? projects : flows;
  const page = pageQuery.data;
  const loadingRows = Math.min(
    project ? project.flowCount : expectedRows({ overview, label, kind }),
    VISIBLE_ROWS,
  );
  const rows =
    kind === 'project'
      ? (projects.data?.data ?? []).map((p) => ({
          id: p.id,
          name: p.displayName,
          sub: null,
          enabled: true,
          icon: <ProjectBadge name={p.displayName} color={p.color} size="lg" />,
          now: groupUtils.name(p.workerGroupId),
          from: p.workerGroupId,
          flows: p.flowCount - p.flowsElsewhere,
        }))
      : (flows.data?.data ?? []).map((f) => ({
          id: f.id,
          name: f.displayName,
          sub: project ? null : f.projectName,
          enabled: f.enabled,
          icon: <FlowBadge size="lg" />,
          now: groupUtils.name(f.effective),
          from: f.workerGroupId,
          flows: undefined,
        }));
  const toggle = (row: { id: string; from: string | null; flows?: number }) =>
    setPicked((prev) =>
      prev.some((i) => i.id === row.id)
        ? prev.filter((i) => i.id !== row.id)
        : [...prev, { kind, id: row.id, from: row.from, flows: row.flows }],
    );
  const addLabel =
    picked.length === 0
      ? kind === 'project'
        ? t('Add projects')
        : t('Add flows')
      : kind === 'project'
      ? t('Add {count, plural, =1 {1 project} other {# projects}}', {
          count: picked.length,
        })
      : t('Add {count, plural, =1 {1 flow} other {# flows}}', {
          count: picked.length,
        });

  return (
    <>
      <DialogHeader className="mb-0">
        <DialogTitle className="pr-8">
          {kind === 'project'
            ? t('Add projects to {group}', {
                group: groupUtils.name(label),
              })
            : t('Add flows to {group}', {
                group: groupUtils.name(label),
              })}
        </DialogTitle>
        <DialogDescription>
          {kind === 'project'
            ? t(
                'The projects you pick, and their flows, will run on this group.',
              )
            : t(
                'The flows you pick will run on this group instead of their project’s group.',
              )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder={
            kind === 'project' ? t('Search projects') : t('Search flows')
          }
        />
        {kind === 'flow' && (
          <ProjectFilter value={project} onChange={setProject} />
        )}
      </div>
      <div
        className={cn(
          adminSurface.listFrame,
          adminSurface.divider,
          'flex flex-col divide-y overflow-y-auto',
        )}
        style={{ height: Math.max(loadingRows, MIN_ROWS) * ROW_PX + 2 }}
      >
        {!page && pageQuery.isError && (
          <DataFetchErrorState
            entity={kind === 'project' ? t('projects') : t('flows')}
            onRetry={() => pageQuery.refetch()}
          />
        )}
        {!page &&
          !pageQuery.isError &&
          Array.from({ length: loadingRows }, (_, i) => (
            <div key={i} className="flex h-12 shrink-0 items-center gap-3 px-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="ml-auto h-3 w-28" />
            </div>
          ))}
        {rows.map((row) => (
          <label
            key={row.id}
            className="flex h-12 shrink-0 cursor-pointer items-center gap-3 px-3 hover:bg-gray-2"
          >
            <Checkbox
              checked={picked.some((i) => i.id === row.id)}
              onCheckedChange={() => toggle(row)}
            />
            {row.icon}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'truncate text-sm',
                    row.enabled ? 'text-gray-12' : 'text-gray-10',
                  )}
                >
                  {row.name}
                </span>
                {!row.enabled && <OffBadge />}
              </span>
              {row.sub && (
                <span className="truncate text-xs text-gray-10">{row.sub}</span>
              )}
            </span>
            <span className="w-48 shrink-0 truncate text-right text-xs text-gray-10 max-sm:hidden">
              {t('Now on {group}', { group: row.now })}
            </span>
          </label>
        ))}
        {page && rows.length === 0 && (
          <p className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-10">
            {search ? t('Nothing matches your search.') : t('Nothing to add.')}
          </p>
        )}
      </div>
      {group && group.online === 0 && (
        <p className="text-sm text-gray-11">
          {t(
            'This group has no workers online. Runs will wait until a worker is back.',
          )}
        </p>
      )}
      <DialogFooter className="mt-0 items-center sm:justify-between">
        <span className="text-sm text-gray-11">
          {[
            t('{count} selected', { count: picked.length }),
            page && page.total > page.data.length
              ? t('first {shown} of {total} shown, search to find others', {
                  shown: page.data.length.toLocaleString(),
                  total: page.total.toLocaleString(),
                })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone}>
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.WORKERS_ASSIGN_SUBMIT)}
            disabled={picked.length === 0}
            loading={saving}
            onClick={() => {
              setSaving(true);
              move({ items: picked, to: label })
                .then((moved) => moved && onDone())
                .catch(() => undefined)
                .finally(() => setSaving(false));
            }}
          >
            {addLabel}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function ProjectFilter({
  value,
  onChange,
}: {
  value: WorkerGroupProjectAssignment | null;
  onChange: (project: WorkerGroupProjectAssignment | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const query = useDebounced({ value: search.trim(), ms: SEARCH_DEBOUNCE_MS });
  const projects = workerGroupsQueries.useProjects({
    params: { filter: 'all', search: query || undefined },
  });
  const pick = (next: WorkerGroupProjectAssignment | null) => {
    onChange(next);
    setOpen(false);
    setSearch('');
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-3 font-normal sm:w-56"
        >
          <span className="flex min-w-0 items-center gap-2">
            {value && (
              <ProjectBadge name={value.displayName} color={value.color} />
            )}
            <span className={cn('truncate', !value && 'text-gray-11')}>
              {value ? value.displayName : t('All projects')}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-gray-10" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-72 p-1"
        align="end"
        collisionPadding={16}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('Find a project')}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[19.5rem] overflow-y-auto">
            <CommandGroup>
              {!search && (
                <ProjectOption
                  value={ALL_PROJECTS_OPTION}
                  title={t('All projects')}
                  selected={value === null}
                  onSelect={() => pick(null)}
                />
              )}
              {(projects.data?.data ?? []).map((p) => (
                <ProjectOption
                  key={p.id}
                  value={p.id}
                  title={p.displayName}
                  badge={<ProjectBadge name={p.displayName} color={p.color} />}
                  selected={value?.id === p.id}
                  onSelect={() => pick(p)}
                />
              ))}
            </CommandGroup>
            {projects.data && projects.data.data.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-gray-10">
                {t('No projects match your search.')}
              </p>
            )}
            {projects.data &&
              projects.data.total > projects.data.data.length && (
                <p className="border-t px-3 py-2 text-xs text-gray-10">
                  {t(
                    'First {shown, number} of {total, number}. Type to narrow.',
                    {
                      shown: projects.data.data.length,
                      total: projects.data.total,
                    },
                  )}
                </p>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ProjectOption({
  value,
  title,
  badge,
  selected,
  onSelect,
}: {
  value: string;
  title: string;
  badge?: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={value} onSelect={onSelect} className="gap-2 py-2">
      <Check
        className={cn(
          'size-4 shrink-0',
          selected ? 'opacity-100' : 'opacity-0',
        )}
      />
      {badge}
      <span className="flex-1 truncate">{title}</span>
    </CommandItem>
  );
}

function expectedRows({
  overview,
  label,
  kind,
}: {
  overview: WorkerGroupsOverview | undefined;
  label: string;
  kind: 'project' | 'flow';
}) {
  if (!overview) return VISIBLE_ROWS;
  const others = overview.groups.filter((g) => g.label !== label);
  return kind === 'project'
    ? overview.defaultGroup.projectCount +
        others.reduce((sum, g) => sum + g.projectCount, 0)
    : overview.defaultGroup.flowCount +
        others.reduce((sum, g) => sum + g.flowCount, 0);
}

const SEARCH_DEBOUNCE_MS = 200;
const ALL_PROJECTS_OPTION = '__all_projects__';
const VISIBLE_ROWS = 8;
const MIN_ROWS = 2;
const ROW_PX = 48;
