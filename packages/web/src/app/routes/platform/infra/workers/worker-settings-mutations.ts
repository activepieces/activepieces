import { SeekPage } from '@activepieces/core-utils';
import { ProjectWithLimits } from '@activepieces/shared';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { PLATFORM_PROJECTS_QUERY_KEY } from '@/app/routes/platform/projects/use-platform-projects';
import { projectCollection } from '@/features/projects/stores/project-collection';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { workerGroupUtils } from './machine-card';

export function useUpdateWorkerSettings() {
  return useOptimisticMutation<
    WorkerSettingsChange,
    SeekPage<ProjectWithLimits>,
    ProjectWithLimits
  >({
    mutationFn: ({ projectId, next }) =>
      saveWorkerSettings({ projectId, request: next }),
    queryKey: PLATFORM_PROJECTS_QUERY_KEY,
    apply: ({ current, vars }) => ({
      ...current,
      data: current.data.map((project) =>
        project.id === vars.projectId ? { ...project, ...vars.next } : project,
      ),
    }),
    scope: WORKER_SETTINGS_SCOPE,
    errorTitle: t("Couldn't save changes"),
    success: ({ vars }) => changeMessage(vars),
    undo: ({ vars }) => ({
      projectId: vars.projectId,
      projectName: vars.projectName,
      next: vars.previous,
      previous: vars.next,
    }),
  });
}

export function useAssignProjectsToGroup() {
  const queryClient = useQueryClient();
  return async ({
    changes,
  }: {
    changes: GroupAssignment[];
  }): Promise<AssignResult> => {
    const results = await Promise.allSettled(
      changes.map((change) =>
        saveWorkerSettings({
          projectId: change.projectId,
          request: { workerGroupId: change.next },
        }),
      ),
    );
    const saved = changes.filter(
      (_change, index) => results[index].status === 'fulfilled',
    );
    const failed: unknown[] = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : [],
    );
    await refreshProjects(queryClient);
    if (saved.length > 0) {
      mutationFeedback.undo({
        message: t(
          '{count, plural, =1 {1 project moved} other {# projects moved}}',
          { count: saved.length },
        ),
        onUndo: () => revertAssignments({ queryClient, changes: saved }),
      });
    }
    return { failed };
  };
}

async function revertAssignments({
  queryClient,
  changes,
}: {
  queryClient: QueryClient;
  changes: GroupAssignment[];
}): Promise<void> {
  const results = await Promise.allSettled(
    changes.map((change) =>
      saveWorkerSettings({
        projectId: change.projectId,
        request: { workerGroupId: change.previous },
      }),
    ),
  );
  await refreshProjects(queryClient);
  const rejected = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  if (rejected) {
    throw rejected.reason;
  }
}

async function saveWorkerSettings({
  projectId,
  request,
}: {
  projectId: string;
  request: WorkerSettings;
}): Promise<ProjectWithLimits> {
  const saved = await api.post<ProjectWithLimits>(
    `/v1/projects/${projectId}`,
    request,
  );
  await projectCollection.preload();
  projectCollection.utils.writeUpdate(saved);
  return saved;
}

function refreshProjects(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: PLATFORM_PROJECTS_QUERY_KEY,
  });
}

function changeMessage({ projectName, next }: WorkerSettingsChange): string {
  if ('workerGroupId' in next) {
    return t('{project} now runs on {group}', {
      project: projectName,
      group: next.workerGroupId
        ? workerGroupUtils.displayName(next.workerGroupId)
        : t('Shared pool'),
    });
  }
  return next.maxConcurrentJobs === null || next.maxConcurrentJobs === undefined
    ? t('{project} uses the default run limit', { project: projectName })
    : t(
        '{project} can run {count, plural, =1 {1 run} other {# runs}} at once',
        { project: projectName, count: next.maxConcurrentJobs },
      );
}

const WORKER_SETTINGS_SCOPE = 'project-worker-settings';

export type WorkerSettings = {
  workerGroupId?: string | null;
  maxConcurrentJobs?: number | null;
};

export type WorkerSettingsChange = {
  projectId: string;
  projectName: string;
  next: WorkerSettings;
  previous: WorkerSettings;
};

export type GroupAssignment = {
  projectId: string;
  next: string | null;
  previous: string | null;
};

export type AssignResult = {
  failed: unknown[];
};
