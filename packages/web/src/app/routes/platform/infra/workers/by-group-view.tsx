import {
  ProjectWithLimits,
  WorkerGroupScope,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Layers, Plus } from 'lucide-react';
import { useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
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
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Layers className="size-10" strokeWidth={1.5} />
        <p className="text-sm">{t('No projects')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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

  const onlineWorkerCount = workers.filter(
    (w) =>
      w.workerGroupScope === WorkerGroupScope.PROJECT &&
      w.workerGroupId === groupLabel,
  ).length;

  return (
    <>
      <div className="flex w-full flex-col rounded-lg border bg-background p-5 gap-4 sm:max-w-[475px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Layers className="size-4" />
          </div>
          <TextWithTooltip tooltipMessage={groupLabel}>
            <span className="text-sm font-semibold truncate min-w-0">
              {groupLabel.replaceAll('_', ' ')}
            </span>
          </TextWithTooltip>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold leading-tight">
              {onlineWorkerCount}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('{count, plural, =1 {worker} other {workers}}', {
                count: onlineWorkerCount,
              })}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {t('{count} online', { count: onlineWorkerCount })}
          </span>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('PROJECTS')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-3.5" />
              {t('Assign')}
            </Button>
          </div>

          {assignedProjects.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('No projects')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {assignedProjects.slice(0, 3).map((project) => (
                <ProjectChip key={project.id} project={project} />
              ))}
              {assignedProjects.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  {t('+{count} more', { count: assignedProjects.length - 3 })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

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
    <div className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
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
  allProjects: ProjectWithLimits[];
  workers: WorkerMachineWithStatus[];
};
