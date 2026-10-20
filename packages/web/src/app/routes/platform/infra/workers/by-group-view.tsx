import {
  ProjectWithLimits,
  WorkerGroupScope,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Layers, Plus, Workflow } from 'lucide-react';
import { useState } from 'react';

import { AdminEmpty, adminSurface } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  WorkerGroupFlow,
  WorkerGroupFlows,
  WorkerGroupInfo,
  workersApi,
} from '@/features/platform-admin/api/workers-api';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { AssignFlowsDialog } from './assign-flows-dialog';
import { AssignProjectsDialog } from './assign-projects-dialog';
import { ProjectAvatar } from './project-avatar';

export function ByGroupView({
  projects,
  workerGroups,
  workers,
}: ByGroupViewProps) {
  const liveProjectGroups = workerGroups
    .filter((g) => g.scope === WorkerGroupScope.PROJECT)
    .map((g) => g.label);
  const groupsFromProjects = projects
    .map((p) => p.workerGroupId)
    .filter((id): id is string => id != null);
  const projectGroupLabels = Array.from(
    new Set([...liveProjectGroups, ...groupsFromProjects]),
  ).sort();

  const flowGroupLabels = Array.from(
    new Set(
      workerGroups
        .filter((g) => g.scope === WorkerGroupScope.FLOW)
        .map((g) => g.label),
    ),
  ).sort();

  if (projectGroupLabels.length === 0 && flowGroupLabels.length === 0) {
    return <AdminEmpty icon={<Layers />} title={t('No worker groups')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {projectGroupLabels.length > 0 && (
        <section className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-11">
            {t('Project worker groups')}
          </span>
          <div className="flex flex-wrap gap-4">
            {projectGroupLabels.map((label) => (
              <GroupCard
                key={label}
                groupLabel={label}
                scope={WorkerGroupScope.PROJECT}
                allProjects={projects}
                workers={workers}
              />
            ))}
          </div>
        </section>
      )}

      {flowGroupLabels.length > 0 && (
        <section className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-11">
            {t('Flow worker groups')}
          </span>
          <div className="flex flex-wrap gap-4">
            {flowGroupLabels.map((label) => (
              <GroupCard
                key={label}
                groupLabel={label}
                scope={WorkerGroupScope.FLOW}
                allProjects={projects}
                workers={workers}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GroupCard({
  groupLabel,
  scope,
  allProjects,
  workers,
}: GroupCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isFlowGroup = scope === WorkerGroupScope.FLOW;

  const assignedProjects = allProjects.filter(
    (p) => p.workerGroupId === groupLabel,
  );

  const groupWorkers = workers.filter(
    (w) => w.workerGroupScope === scope && w.workerGroupId === groupLabel,
  );
  const onlineWorkerCount = groupWorkers.length;
  const totalSlots = groupWorkers.reduce((sum, worker) => {
    const parsed = Number(worker.information.workerProps.WORKER_CONCURRENCY);
    return sum + (Number.isInteger(parsed) && parsed > 0 ? parsed : 1);
  }, 0);

  return (
    <>
      <div
        className={cn(
          adminSurface.card,
          'flex w-full flex-col gap-4 p-5 sm:w-[475px]',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-3 text-accent-11">
            {isFlowGroup ? (
              <Workflow className="size-4" />
            ) : (
              <Layers className="size-4" />
            )}
          </div>
          <TextWithTooltip tooltipMessage={groupLabel}>
            <span className="text-sm font-semibold truncate min-w-0">
              {groupLabel.replaceAll('_', ' ')}
            </span>
          </TextWithTooltip>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-gray-12">
            {onlineWorkerCount}
          </span>
          <span className="text-sm text-gray-11">
            {t('{count, plural, =1 {worker} other {workers}}', {
              count: onlineWorkerCount,
            })}{' '}
            | {t('{count} total concurrencies', { count: totalSlots })}
          </span>
        </div>

        {isFlowGroup ? (
          <div className="flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-11">
                {t('Flows')}
              </span>
              <Button
                {...adminControl(AdminControl.WORKERS_ASSIGN_OPEN)}
                variant="ghost"
                size="xs"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="size-3.5" />
                {t('Assign')}
              </Button>
            </div>
            <AssignedFlowChips groupLabel={groupLabel} />
          </div>
        ) : (
          <div className="flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-11">
                {t('Projects')}
              </span>
              <Button
                {...adminControl(AdminControl.WORKERS_ASSIGN_OPEN)}
                variant="ghost"
                size="xs"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="size-3.5" />
                {t('Assign')}
              </Button>
            </div>

            {assignedProjects.length === 0 ? (
              <p className="text-xs text-gray-11">{t('No projects')}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {assignedProjects.slice(0, 3).map((project) => (
                  <ProjectChip key={project.id} project={project} />
                ))}
                {assignedProjects.length > 3 && (
                  <span className="text-xs text-gray-11">
                    {t('+{count} more', { count: assignedProjects.length - 3 })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isFlowGroup ? (
        <AssignFlowsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          groupLabel={groupLabel}
          allProjects={allProjects}
        />
      ) : (
        <AssignProjectsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          groupLabel={groupLabel}
          allProjects={allProjects}
        />
      )}
    </>
  );
}

function AssignedFlowChips({ groupLabel }: { groupLabel: string }) {
  const { data, isError, refetch } = useQuery<WorkerGroupFlows>({
    queryKey: ['worker-group-assigned-flows', groupLabel],
    queryFn: () => workersApi.listGroupFlows(groupLabel),
  });
  const flows = data?.flows ?? [];
  const total = data?.total ?? 0;

  if (isError) {
    return <DataFetchErrorState entity={t('flows')} onRetry={refetch} />;
  }

  if (flows.length === 0) {
    return <p className="text-xs text-gray-11">{t('No flows')}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {flows.slice(0, 3).map((flow) => (
        <FlowChip key={flow.id} flow={flow} />
      ))}
      {total > 3 && (
        <span className="text-xs text-gray-11">
          {t('+{count} more', { count: total - 3 })}
        </span>
      )}
    </div>
  );
}

function FlowChip({ flow }: { flow: WorkerGroupFlow }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-gray-3/40 px-2 py-0.5 text-xs">
      <Workflow className="size-3 shrink-0 text-gray-11" />
      <TextWithTooltip tooltipMessage={flow.displayName}>
        <span className="max-w-[100px] truncate">{flow.displayName}</span>
      </TextWithTooltip>
    </div>
  );
}

function ProjectChip({ project }: { project: ProjectWithLimits }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-gray-3/40 px-2 py-0.5 text-xs">
      <ProjectAvatar project={project} size="sm" />
      <TextWithTooltip tooltipMessage={project.displayName}>
        <span className="max-w-[100px] truncate">{project.displayName}</span>
      </TextWithTooltip>
    </div>
  );
}

type ByGroupViewProps = {
  projects: ProjectWithLimits[];
  workerGroups: WorkerGroupInfo[];
  workers: WorkerMachineWithStatus[];
};

type GroupCardProps = {
  groupLabel: string;
  scope: WorkerGroupScope;
  allProjects: ProjectWithLimits[];
  workers: WorkerMachineWithStatus[];
};
