import {
  WorkerGroupFlowAssignment,
  WorkerGroupProjectAssignment,
  WorkerGroupsOverview,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useState } from 'react';

import { StatusDot, adminSurface } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { groupUtils, useMover, workerGroupsQueries } from './hooks';
import {
  FlowBadge,
  OffBadge,
  Pager,
  ProjectBadge,
  WorkerGroupSelect,
} from './parts';

export function SearchResults({
  overview,
  query,
  fallback,
}: {
  overview: WorkerGroupsOverview | undefined;
  query: string;
  fallback: React.ReactNode;
}) {
  const projectPages = usePages(query);
  const flowPages = usePages(query);
  const projects = workerGroupsQueries.useSearch({
    kind: 'project',
    query,
    cursor: projectPages.cursor,
  });
  const flows = workerGroupsQueries.useSearch({
    kind: 'flow',
    query,
    cursor: flowPages.cursor,
  });
  if (!projects.data || !flows.data) {
    if (projects.isError || flows.isError) {
      return (
        <DataFetchErrorState
          entity={t('search results')}
          onRetry={() => {
            projects.refetch();
            flows.refetch();
          }}
        />
      );
    }
    return <>{fallback}</>;
  }
  const total = projects.data.total + flows.data.total;
  if (total === 0) {
    return (
      <p className="text-sm text-gray-11">
        {t('Nothing matches {query}.', {
          query: groupUtils.quote(query.trim()),
        })}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-11">
        {t('{count, plural, =1 {1 result} other {{countText} results}}', {
          count: total,
          countText: total.toLocaleString(),
        })}
      </p>
      {projects.data.total > 0 && (
        <ResultSection
          title={t('Projects')}
          page={projects.data}
          onCursor={projectPages.setCursor}
        >
          {(projects.data.data as WorkerGroupProjectAssignment[]).map(
            (project) => (
              <ProjectResult
                key={project.id}
                project={project}
                overview={overview}
              />
            ),
          )}
        </ResultSection>
      )}
      {flows.data.total > 0 && (
        <ResultSection
          title={t('Flows')}
          page={flows.data}
          onCursor={flowPages.setCursor}
        >
          {(flows.data.data as WorkerGroupFlowAssignment[]).map((flow) => (
            <FlowResult key={flow.id} flow={flow} overview={overview} />
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function usePages(query: string) {
  const [state, setState] = useState<{
    query: string;
    cursor: string | undefined;
  }>({ query, cursor: undefined });
  return {
    cursor: state.query === query ? state.cursor : undefined,
    setCursor: (cursor: string | undefined) => setState({ query, cursor }),
  };
}

function ResultSection({
  title,
  page,
  onCursor,
  children,
}: {
  title: string;
  page: {
    offset: number;
    total: number;
    data: unknown[];
    next: string | null;
    previous: string | null;
  };
  onCursor: (cursor: string | undefined) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex h-8 items-center justify-between gap-3">
        <h3 className="flex items-baseline gap-2 text-sm font-medium text-gray-12">
          {title}
          {page.total <= page.data.length && (
            <span className="font-normal tabular-nums text-gray-10">
              {page.total.toLocaleString()}
            </span>
          )}
        </h3>
        <Pager
          offset={page.offset}
          count={page.data.length}
          total={page.total}
          onPrevious={
            page.previous !== null
              ? () => onCursor(page.previous ?? undefined)
              : undefined
          }
          onNext={
            page.next !== null
              ? () => onCursor(page.next ?? undefined)
              : undefined
          }
        />
      </div>
      <ResultList>{children}</ResultList>
    </section>
  );
}

function ProjectResult({
  project,
  overview,
}: {
  project: WorkerGroupProjectAssignment;
  overview: WorkerGroupsOverview | undefined;
}) {
  const { move } = useMover();
  return (
    <ResultRow
      icon={
        <ProjectBadge
          name={project.displayName}
          color={project.color}
          size="lg"
        />
      }
      down={
        groupUtils.find({
          overview,
          label: project.workerGroupId,
          scope: 'project',
        })?.online === 0
      }
      sentence={
        <>
          <b className="font-medium text-gray-12">{project.displayName}</b>{' '}
          {t('runs on')}{' '}
          <b className="font-medium text-gray-12">
            {groupUtils.name(project.workerGroupId)}
          </b>
        </>
      }
      action={
        <WorkerGroupSelect
          kind="project"
          value={project.workerGroupId}
          overview={overview}
          subject={project.displayName}
          align="end"
          onChange={(to) => {
            move({
              items: [
                {
                  kind: 'project',
                  id: project.id,
                  from: project.workerGroupId,
                },
              ],
              to,
            }).catch(() => undefined);
          }}
          trigger={
            <Button variant="outline" size="sm">
              {t('Change')}
            </Button>
          }
        />
      }
    />
  );
}

function FlowResult({
  flow,
  overview,
}: {
  flow: WorkerGroupFlowAssignment;
  overview: WorkerGroupsOverview | undefined;
}) {
  const { move } = useMover();
  return (
    <ResultRow
      icon={<FlowBadge size="lg" />}
      down={
        groupUtils.find({
          overview,
          label: flow.effective,
          scope: flow.workerGroupId === null ? 'project' : 'flow',
        })?.online === 0
      }
      sentence={
        <>
          <b className="font-medium text-gray-12">{flow.displayName}</b>{' '}
          {!flow.enabled && <OffBadge />}{' '}
          {t('in {project} runs on', { project: flow.projectName })}{' '}
          <b className="font-medium text-gray-12">
            {groupUtils.name(flow.effective)}
          </b>
          {flow.workerGroupId === null && (
            <span className="text-gray-10"> {t('(the project’s group)')}</span>
          )}
        </>
      }
      action={
        <WorkerGroupSelect
          kind="flow"
          value={flow.workerGroupId}
          inherited={flow.inherited}
          overview={overview}
          subject={flow.displayName}
          align="end"
          onChange={(to) => {
            move({
              items: [{ kind: 'flow', id: flow.id, from: flow.workerGroupId }],
              to,
            }).catch(() => undefined);
          }}
          trigger={
            <Button variant="outline" size="sm">
              {t('Change')}
            </Button>
          }
        />
      }
    />
  );
}

function ResultList({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        adminSurface.listFrame,
        adminSurface.divider,
        'flex flex-col divide-y',
      )}
    >
      {children}
    </div>
  );
}

function ResultRow({
  icon,
  sentence,
  down,
  action,
}: {
  icon: React.ReactNode;
  sentence: React.ReactNode;
  down: boolean;
  action: React.ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      {icon}
      <p className="min-w-0 flex-1 text-sm text-gray-11">
        {sentence}
        {down && (
          <StatusDot
            tone="danger"
            className="ml-2 inline-flex text-xs text-danger-11"
          >
            {t('No workers online')}
          </StatusDot>
        )}
      </p>
      <span className="shrink-0">{action}</span>
    </div>
  );
}
