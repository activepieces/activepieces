import {
  ProjectWithLimits,
  WorkerGroupScope,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Layers, Plus } from 'lucide-react';
import { useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { WorkerGroupInfo } from '@/features/platform-admin/api/workers-api';

import { AssignProjectsDialog } from './assign-projects-dialog';
import { ProjectAvatar } from './project-avatar';

export function ByGroupView({
  projects,
  workerGroups,
  workers,
}: ByGroupViewProps) {
  const groupsFromLive = workerGroups.map((g) => g.label);
  const groupsFromProjects = projects
    .map((p) => p.workerGroupId)
    .filter((id): id is string => id != null);

  const allGroupLabels = Array.from(
    new Set([...groupsFromLive, ...groupsFromProjects]),
  ).sort();

  if (allGroupLabels.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Layers />
          </EmptyMedia>
          <EmptyTitle>{t('No projects')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {allGroupLabels.map((label) => (
        <GroupCard
          key={label}
          groupLabel={label}
          allProjects={projects}
          workers={workers}
        />
      ))}
    </div>
  );
}

function GroupCard({ groupLabel, allProjects, workers }: GroupCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const assignedProjects = allProjects.filter(
    (p) => p.workerGroupId === groupLabel,
  );

  const groupWorkers = workers.filter(
    (w) =>
      w.workerGroupScope === WorkerGroupScope.PROJECT &&
      w.workerGroupId === groupLabel,
  );
  const onlineWorkerCount = groupWorkers.length;
  const totalSlots = groupWorkers.reduce((sum, worker) => {
    const parsed = Number(worker.information.workerProps.WORKER_CONCURRENCY);
    return sum + (Number.isInteger(parsed) && parsed > 0 ? parsed : 1);
  }, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-3 text-accent-11">
              <Layers className="size-4" />
            </div>
            <TextWithTooltip tooltipMessage={groupLabel}>
              <span className="min-w-0 truncate font-semibold">
                {groupLabel.replaceAll('_', ' ')}
              </span>
            </TextWithTooltip>
          </div>
        </CardHeader>

        <CardContent className="flex-row items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {onlineWorkerCount}
          </span>
          <span className="text-sm text-gray-11">
            {t('{count, plural, =1 {worker} other {workers}}', {
              count: onlineWorkerCount,
            })}{' '}
            | {t('{count} total concurrencies', { count: totalSlots })}
          </span>
        </CardContent>

        <CardContent className="border-t border-gray-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-11">
              {t('Projects')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Plus />
              {t('Assign')}
            </Button>
          </div>

          {assignedProjects.length === 0 ? (
            <p className="text-sm text-gray-11">{t('No projects')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {assignedProjects.slice(0, 3).map((project) => (
                <ProjectChip key={project.id} project={project} />
              ))}
              {assignedProjects.length > 3 && (
                <span className="text-sm text-gray-11">
                  {t('+{count} more', { count: assignedProjects.length - 3 })}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignProjectsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupLabel={groupLabel}
        allProjects={allProjects}
      />
    </>
  );
}

function ProjectChip({ project }: { project: ProjectWithLimits }) {
  return (
    <Badge variant="secondary" className="max-w-40">
      <ProjectAvatar project={project} size="sm" />
      <TextWithTooltip tooltipMessage={project.displayName}>
        <span className="min-w-0 truncate">{project.displayName}</span>
      </TextWithTooltip>
    </Badge>
  );
}

type ByGroupViewProps = {
  projects: ProjectWithLimits[];
  workerGroups: WorkerGroupInfo[];
  workers: WorkerMachineWithStatus[];
};

type GroupCardProps = {
  groupLabel: string;
  allProjects: ProjectWithLimits[];
  workers: WorkerMachineWithStatus[];
};
