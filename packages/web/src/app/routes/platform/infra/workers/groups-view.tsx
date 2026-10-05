import {
  ColorName,
  ProjectType,
  ProjectWithLimits,
  WorkerGroupScope,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Layers, Server } from 'lucide-react';
import { useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { PageSection } from '@/components/custom/page';
import { ResourceCard, ResourceGrid } from '@/components/custom/resource-card';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { workersQueries } from '@/features/platform-admin';
import { WorkerGroupInfo } from '@/features/platform-admin/api/workers-api';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';

import { AssignProjectsDialog } from './assign-projects-dialog';
import { WorkerIconTile, workerGroupUtils } from './machine-card';
import { ProjectGroupRow, ProjectGroupsTable } from './project-groups-table';

export function GroupsView() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isSample = !platform.plan.workerGroupsEnabled;
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const {
    data: capacity,
    isLoading,
    isError,
    refetch,
  } = workersQueries.useWorkerGroups(!isSample);
  const { data: machines } = workersQueries.useWorkerMachines();
  const [assigning, setAssigning] = useState<string | null>(null);

  const liveGroups = isSample ? SAMPLE_GROUPS : capacity?.groups ?? [];
  const sharedSlots = isSample
    ? SAMPLE_SHARED_SLOTS
    : capacity?.sharedSlots ?? 0;
  const cards = isSample
    ? SAMPLE_CARDS
    : buildCards({ liveGroups, projects, machines: machines ?? [] });
  const sharedProjects = isSample
    ? SAMPLE_SHARED_PROJECTS
    : projects.filter((project) => !project.workerGroupId).length;

  return (
    <>
      <PageSection
        title={t('Groups')}
        description={t(
          "A group is a set of machines started with the same AP_WORKER_GROUP_ID. Projects you assign run only on that group's machines.",
        )}
        action={
          <Button variant="link" asChild>
            <a href={DOCS_URL} target="_blank" rel="noreferrer">
              {t('Read the docs')}
              <ExternalLink />
            </a>
          </Button>
        }
      >
        <GroupCards
          isLoading={!isSample && isLoading}
          isError={!isSample && isError}
          onRetry={() => refetch()}
          cards={cards}
          sharedSlots={sharedSlots}
          sharedProjects={sharedProjects}
          onAssign={isSample ? undefined : setAssigning}
        />
      </PageSection>
      <PageSection
        title={t('Projects')}
        description={t(
          'Pick where each project runs and how many of its runs can go at once. Leave the limit empty to use the default.',
        )}
      >
        <ProjectGroupsTable
          groups={liveGroups}
          sharedSlots={sharedSlots}
          sampleRows={isSample ? SAMPLE_ROWS : undefined}
        />
      </PageSection>
      <AssignProjectsDialog
        open={assigning !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssigning(null);
          }
        }}
        groupLabel={assigning ?? ''}
        allProjects={projects}
      />
    </>
  );
}

function GroupCards({
  isLoading,
  isError,
  onRetry,
  cards,
  sharedSlots,
  sharedProjects,
  onAssign,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  cards: GroupCardData[];
  sharedSlots: number;
  sharedProjects: number;
  onAssign?: (label: string) => void;
}) {
  if (isLoading) {
    return (
      <ResourceGrid>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </ResourceGrid>
    );
  }
  if (isError) {
    return (
      <DataFetchErrorState entity={t('worker groups')} onRetry={onRetry} />
    );
  }
  if (cards.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Layers />
          </EmptyMedia>
          <EmptyTitle>{t('No worker groups yet')}</EmptyTitle>
          <EmptyDescription>
            {t(
              'Start machines with AP_WORKER_GROUP_ID set and their group appears here, ready for projects. Until then every project runs on the shared pool.',
            )}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <ResourceGrid>
      <ResourceCard
        media={<WorkerIconTile icon={Server} />}
        title={t('Shared pool')}
        status={
          <StatusDot tone="neutral">
            {t('Runs every unassigned project')}
          </StatusDot>
        }
        meta={capacityLine({ slots: sharedSlots, projects: sharedProjects })}
      />
      {cards.map((card) => (
        <ResourceCard
          key={card.label}
          media={<WorkerIconTile icon={Layers} />}
          title={workerGroupUtils.displayName(card.label)}
          status={
            card.machines > 0 ? (
              <StatusDot tone="success">
                {t(
                  '{count, plural, =1 {# machine online} other {# machines online}}',
                  { count: card.machines },
                )}
              </StatusDot>
            ) : (
              <StatusDot tone="danger">{t('No machines online')}</StatusDot>
            )
          }
          meta={capacityLine({ slots: card.slots, projects: card.projects })}
          action={
            <Button
              variant="outline"
              size="sm"
              disabled={!onAssign}
              onClick={() => onAssign?.(card.label)}
            >
              {t('Assign projects')}
            </Button>
          }
        />
      ))}
    </ResourceGrid>
  );
}

function capacityLine({
  slots,
  projects,
}: {
  slots: number;
  projects: number;
}): string {
  return t(
    '{slots, plural, =1 {# run slot} other {# run slots}} · {projects, plural, =1 {# project} other {# projects}}',
    { slots, projects },
  );
}

function buildCards({
  liveGroups,
  projects,
  machines,
}: {
  liveGroups: WorkerGroupInfo[];
  projects: ProjectWithLimits[];
  machines: WorkerMachineWithStatus[];
}): GroupCardData[] {
  const labels = Array.from(
    new Set([
      ...liveGroups.map((group) => group.label),
      ...projects.flatMap((project) =>
        project.workerGroupId ? [project.workerGroupId] : [],
      ),
    ]),
  ).sort();
  return labels.map((label) => ({
    label,
    slots: liveGroups.find((group) => group.label === label)?.slots ?? 0,
    machines: machines.filter(
      (machine) =>
        machine.workerGroupScope === WorkerGroupScope.PROJECT &&
        machine.workerGroupId === label,
    ).length,
    projects: projects.filter((project) => project.workerGroupId === label)
      .length,
  }));
}

function sampleRow({
  id,
  displayName,
  color,
  flows,
  workerGroupId,
  maxConcurrentJobs,
}: Omit<ProjectGroupRow, 'type' | 'icon'> & {
  color: ColorName;
}): ProjectGroupRow {
  return {
    id,
    displayName,
    type: ProjectType.TEAM,
    icon: { color },
    flows,
    workerGroupId,
    maxConcurrentJobs,
  };
}

const DOCS_URL =
  'https://www.activepieces.com/docs/install/configure-operate/worker-groups';

const SAMPLE_GROUPS: WorkerGroupInfo[] = [
  { label: 'finance', slots: 8 },
  { label: 'high_priority', slots: 20 },
];

const SAMPLE_SHARED_SLOTS = 40;

const SAMPLE_SHARED_PROJECTS = 11;

const SAMPLE_CARDS: GroupCardData[] = [
  { label: 'finance', slots: 8, machines: 1, projects: 2 },
  { label: 'high_priority', slots: 20, machines: 2, projects: 3 },
];

const SAMPLE_ROWS: ProjectGroupRow[] = [
  sampleRow({
    id: 'sample-1',
    displayName: 'Billing',
    color: ColorName.GREEN,
    flows: 14,
    workerGroupId: 'finance',
    maxConcurrentJobs: 4,
  }),
  sampleRow({
    id: 'sample-2',
    displayName: 'Customer onboarding',
    color: ColorName.BLUE,
    flows: 22,
    workerGroupId: 'high_priority',
    maxConcurrentJobs: null,
  }),
  sampleRow({
    id: 'sample-3',
    displayName: 'Marketing',
    color: ColorName.PINK,
    flows: 9,
    workerGroupId: null,
    maxConcurrentJobs: null,
  }),
  sampleRow({
    id: 'sample-4',
    displayName: 'Support',
    color: ColorName.ORANGE,
    flows: 17,
    workerGroupId: 'high_priority',
    maxConcurrentJobs: 10,
  }),
];

type GroupCardData = {
  label: string;
  slots: number;
  machines: number;
  projects: number;
};
