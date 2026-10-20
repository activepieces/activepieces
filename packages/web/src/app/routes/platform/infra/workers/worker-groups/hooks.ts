import {
  WORKER_GROUP_BULK_ASSIGN_MAX_ITEMS,
  chunk,
  tryCatch,
  WorkerGroupFlowAssignmentPage,
  WorkerGroupProjectAssignmentPage,
  WorkerGroupScope,
  WorkerGroupSummary,
  WorkerGroupsOverview,
} from '@activepieces/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

import { workerGroupsApi } from './api';

export const workerGroupsQueries = {
  useOverview() {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: [...KEYS.root, 'overview'],
      queryFn: () => workerGroupsApi.overview(),
      refetchInterval: 15000,
      enabled: platform.plan.workerGroupsEnabled,
    });
  },
  useProjects({
    params,
    enabled = true,
  }: {
    params: ProjectListParams;
    enabled?: boolean;
  }) {
    return useQuery({
      queryKey: [...KEYS.lists, 'projects', params],
      queryFn: () => workerGroupsApi.projects({ limit: PAGE_SIZE, ...params }),
      placeholderData: keepPreviousData,
      enabled,
    });
  },
  useFlows({
    params,
    enabled = true,
  }: {
    params: FlowListParams;
    enabled?: boolean;
  }) {
    return useQuery({
      queryKey: [...KEYS.lists, 'flows', params],
      queryFn: () =>
        workerGroupsApi.flows({
          limit: params.projectId ? PROJECT_FLOWS_PAGE_SIZE : PAGE_SIZE,
          ...params,
        }),
      placeholderData: keepPreviousData,
      enabled,
    });
  },
  useSearch({
    kind,
    query,
    cursor,
  }: {
    kind: 'project' | 'flow';
    query: string;
    cursor: string | undefined;
  }) {
    const debounced = useDebounced({ value: query.trim(), ms: 200 });
    return useQuery({
      queryKey: [...KEYS.lists, 'search', kind, debounced, cursor],
      queryFn: (): Promise<SearchPage> => {
        const params = {
          filter: 'all' as const,
          search: debounced,
          limit: SEARCH_PAGE_SIZE,
          cursor,
        };
        return kind === 'project'
          ? workerGroupsApi.projects(params)
          : workerGroupsApi.flows(params);
      },
      enabled: debounced.length > 0,
      placeholderData: keepPreviousData,
    });
  },
};

export function useMover() {
  const queryClient = useQueryClient();

  const move = async ({
    items,
    to,
  }: {
    items: MoveItem[];
    to: string | null;
  }) => {
    const changed = items.filter((item) => item.from !== to);
    if (changed.length === 0) return false;
    const { done, waiting, failed } = await sendMovesInParts({
      items: changed,
      to,
    });
    if (done.length === 0) {
      toast.error(t('Could not move. Nothing was changed.'));
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: KEYS.root });
    const notify = failed ? toast.error : toast.success;
    notify(
      failed
        ? t(
            'Moved {done, number} of {total, number}. The rest could not be moved.',
            { done: done.length, total: changed.length },
          )
        : movedMessage({
            to,
            waiting,
            projects: done.filter((i) => i.kind === 'project').length,
            flows: done.filter((i) => i.kind === 'flow').length,
          }),
      {
        id: MOVE_TOAST_ID,
        style: TOAST_STYLE,
        action: {
          label: t('Undo'),
          onClick: () => {
            undoMoves({ items: done })
              .then(() => toast.success(t('Move undone.')))
              .catch(() => toast.error(t('Could not undo the move.')))
              .finally(() =>
                queryClient.invalidateQueries({ queryKey: KEYS.root }),
              );
          },
        },
      },
    );
    return true;
  };

  const moveAll = async ({
    from,
    scope,
    to,
  }: {
    from: string;
    scope: GroupScope;
    to: string | null;
  }) => {
    const { data: result, error } = await tryCatch(() =>
      workerGroupsApi.moveAll({
        from,
        scope:
          scope === 'flow' ? WorkerGroupScope.FLOW : WorkerGroupScope.PROJECT,
        to,
      }),
    );
    if (error) {
      toast.error(t('Could not move. Nothing was changed.'));
      return false;
    }
    projectCollectionUtils.setWorkerGroup({
      projectIds: result.projects,
      workerGroupId: to,
    });
    await queryClient.invalidateQueries({ queryKey: KEYS.root });
    if (result.projects.length + result.flows.length === 0) {
      toast.success(t('Nothing was left to move.'), { id: MOVE_TOAST_ID });
      return true;
    }
    toast.success(
      movedMessage({
        to,
        waiting: result.movedWaitingRuns,
        projects: result.projects.length,
        flows: result.flows.length,
      }),
      {
        id: MOVE_TOAST_ID,
        style: TOAST_STYLE,
        action: {
          label: t('Undo'),
          onClick: () => {
            sendMoves({
              items: [
                ...result.projects.map((id) => ({
                  kind: 'project' as const,
                  id,
                  from: to,
                })),
                ...result.flows.map((id) => ({
                  kind: 'flow' as const,
                  id,
                  from: to,
                })),
              ],
              to: from,
            })
              .then(() => toast.success(t('Move undone.')))
              .catch(() => toast.error(t('Could not undo the move.')))
              .finally(() =>
                queryClient.invalidateQueries({ queryKey: KEYS.root }),
              );
          },
        },
      },
    );
    return true;
  };

  return { move, moveAll };
}

export function useRunLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workerGroupsApi.setRunLimit,
    onSuccess: async (project, { maxConcurrentJobs }) => {
      projectCollectionUtils.syncFromServer(project);
      await queryClient.invalidateQueries({ queryKey: KEYS.lists });
      toast.success(
        maxConcurrentJobs === null
          ? t('{project} now uses the default concurrency limit.', {
              project: project.displayName,
            })
          : t('{project} now has a concurrency limit of {count, number}.', {
              project: project.displayName,
              count: maxConcurrentJobs,
            }),
      );
    },
    onError: () => {
      toast.error(
        t('Could not save the concurrency limit. Nothing was changed.'),
      );
    },
  });
}

export const groupUtils = {
  name(label: string | null) {
    return label === null ? t('Shared workers') : label.replaceAll('_', ' ');
  },
  urlKey({ label, scope }: GroupRef) {
    return label === null ? SHARED_KEY : `${scope}:${label}`;
  },
  fromKey(key: string): GroupRef {
    if (key === SHARED_KEY) return { label: null, scope: 'project' };
    if (key.startsWith(FLOW_KEY_PREFIX))
      return { label: key.slice(FLOW_KEY_PREFIX.length), scope: 'flow' };
    if (key.startsWith(PROJECT_KEY_PREFIX))
      return { label: key.slice(PROJECT_KEY_PREFIX.length), scope: 'project' };
    return { label: key, scope: 'project' };
  },
  projectListParams(
    label: string | null,
  ): Pick<ProjectListParams, 'group' | 'filter'> {
    return label === null ? { filter: 'shared' } : { group: label };
  },
  quote(name: string) {
    return `“${name}”`;
  },
  find({
    overview,
    label,
    scope,
  }: GroupRef & { overview: WorkerGroupsOverview | undefined }) {
    if (label === null || !overview) return undefined;
    return overview.groups.find((g) => g.label === label && g.scope === scope);
  },
  capacity({ online, slots }: { online: number; slots: number }) {
    return t(
      '{workers, plural, =1 {1 worker} other {# workers}} · concurrency {slots, number}',
      { workers: online, slots },
    );
  },
  usage({
    projectCount,
    flowCount,
  }: {
    projectCount: number;
    flowCount: number;
  }) {
    return t(
      '{projects, plural, =1 {1 project} other {{projectsText} projects}} · {flows, plural, =1 {1 flow} other {{flowsText} flows}}',
      {
        projects: projectCount,
        flows: flowCount,
        projectsText: compact(projectCount),
        flowsText: compact(flowCount),
      },
    );
  },
  flowUsage(flowCount: number) {
    return t('{flows, plural, =1 {1 flow} other {{flowsText} flows}}', {
      flows: flowCount,
      flowsText: compact(flowCount),
    });
  },
  compact(value: number) {
    return compact(value);
  },
  inUse(
    group: Pick<WorkerGroupSummary, 'scope' | 'projectCount' | 'flowCount'>,
  ) {
    return group.scope === 'project'
      ? group.projectCount > 0
      : group.flowCount > 0;
  },
};

function compact(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export function useDebounced({ value, ms }: { value: string; ms: number }) {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setCurrent(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return current;
}

async function sendMoves({
  items,
  to,
}: {
  items: MoveItem[];
  to: string | null;
}) {
  const { waiting, failed } = await sendMovesInParts({ items, to });
  if (failed) throw new Error('move failed');
  return waiting;
}

async function sendMovesInParts({
  items,
  to,
}: {
  items: MoveItem[];
  to: string | null;
}) {
  const done: MoveItem[] = [];
  let waiting = 0;
  for (const part of chunk(items, WORKER_GROUP_BULK_ASSIGN_MAX_ITEMS)) {
    const { data, error } = await tryCatch(() =>
      workerGroupsApi.assign({
        projects: part.filter((i) => i.kind === 'project').map((i) => i.id),
        flows: part.filter((i) => i.kind === 'flow').map((i) => i.id),
        workerGroupId: to,
      }),
    );
    if (error) return { done, waiting, failed: true };
    projectCollectionUtils.setWorkerGroup({
      projectIds: part.filter((i) => i.kind === 'project').map((i) => i.id),
      workerGroupId: to,
    });
    done.push(...part);
    waiting += data.movedWaitingRuns;
  }
  return { done, waiting, failed: false };
}

async function undoMoves({ items }: { items: MoveItem[] }) {
  const byTarget = new Map<string | null, MoveItem[]>();
  items.forEach((item) => {
    byTarget.set(item.from, [...(byTarget.get(item.from) ?? []), item]);
  });
  for (const [from, group] of byTarget) {
    await sendMoves({ items: group, to: from });
  }
}

function movedMessage({
  to,
  waiting,
  projects,
  flows,
}: {
  to: string | null;
  waiting: number;
  projects: number;
  flows: number;
}) {
  const target = groupUtils.name(to);
  const what =
    projects > 0 && flows > 0
      ? t(
          'Moved {projects, plural, =1 {1 project} other {# projects}} and {flows, plural, =1 {1 flow} other {# flows}} to {group}.',
          { projects, flows, group: target },
        )
      : projects > 0
      ? t(
          'Moved {count, plural, =1 {1 project} other {# projects}} to {group}.',
          { count: projects, group: target },
        )
      : to === null
      ? t(
          'Moved {count, plural, =1 {1 flow back to its project group.} other {# flows back to their project groups.}}',
          { count: flows },
        )
      : t('Moved {count, plural, =1 {1 flow} other {# flows}} to {group}.', {
          count: flows,
          group: target,
        });
  if (waiting === 0) return what;
  return `${what} ${t(
    '{count, plural, =1 {1 waiting run went with them.} other {# waiting runs went with them.}}',
    { count: waiting },
  )}`;
}

const FLOW_KEY_PREFIX = 'flow:';
const PROJECT_KEY_PREFIX = 'project:';
const SHARED_KEY = 'shared:';
const MOVE_TOAST_ID = 'worker-group-move';
const TOAST_STYLE = {
  width: 'max-content',
  maxWidth: 'min(720px, calc(100vw - 32px))',
};

const KEYS = {
  root: ['worker-groups-v2'],
  lists: ['worker-groups-v2', 'lists'],
};

export const PAGE_SIZE = 50;
const SEARCH_PAGE_SIZE = 10;
export const PROJECT_FLOWS_PAGE_SIZE = 20;

type ProjectListParams = {
  group?: string;
  filter?: 'all' | 'shared';
  exclude?: string;
  search?: string;
  cursor?: string;
};

type FlowListParams = {
  limit?: number;
  group?: string;
  filter?: 'all' | 'pinned';
  exclude?: string;
  projectId?: string;
  search?: string;
  cursor?: string;
};

export type MoveItem = {
  kind: 'project' | 'flow';
  id: string;
  from: string | null;
  flows?: number;
};

type SearchPage =
  | WorkerGroupProjectAssignmentPage
  | WorkerGroupFlowAssignmentPage;

type GroupScope = 'project' | 'flow';

type GroupRef = { label: string | null; scope: GroupScope };
