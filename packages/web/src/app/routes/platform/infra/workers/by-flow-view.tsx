import {
  isNil,
  SeekPage,
  FlowStatus,
  PopulatedFlow,
  ProjectType,
  ProjectWithLimits,
  WorkerGroupScope,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Cpu, Search, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  WorkerGroupInfo,
  workersApi,
} from '@/features/platform-admin/api/workers-api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { ProjectAvatar } from './project-avatar';

const DEFAULT_SENTINEL = '__default__';
const FLOW_NAME_QUERY_PARAM = 'flowName';

export function ByFlowView({ projects, workerGroups }: ByFlowViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = searchParams.get('limit') ?? '10';
  const flowName = searchParams.get(FLOW_NAME_QUERY_PARAM) ?? undefined;

  const defaultProject =
    projects.find((project) => project.type === ProjectType.TEAM) ??
    projects[0];
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(defaultProject?.id);

  const {
    data: page,
    isLoading,
    isError,
    refetch,
  } = useProjectFlowsPage({
    projectId: selectedProjectId,
    cursor,
    limit,
    name: flowName,
  });

  const flowWorkerGroups = useMemo(
    () => workerGroups.filter((group) => group.scope === WorkerGroupScope.FLOW),
    [workerGroups],
  );

  const columns = useMemo(
    () => buildColumns({ workerGroups: flowWorkerGroups }),
    [flowWorkerGroups],
  );

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('cursor');
        return next;
      },
      { replace: true },
    );
  };

  const projectSelector = (
    <Select value={selectedProjectId} onValueChange={handleProjectChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder={t('Select a project')} />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex items-center gap-2 min-w-0">
              <ProjectAvatar project={project} />
              <span className="truncate">{project.displayName}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const searchBar = (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-11" />
      <Input
        className="pl-8 w-[240px]"
        placeholder={t('Search flows')}
        defaultValue={flowName ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (value) {
                next.set(FLOW_NAME_QUERY_PARAM, value);
              } else {
                next.delete(FLOW_NAME_QUERY_PARAM);
              }
              next.delete('cursor');
              return next;
            },
            { replace: true },
          );
        }}
      />
    </div>
  );

  if (isNil(defaultProject)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-11">
        <Workflow className="size-10" strokeWidth={1.5} />
        <p className="text-sm">{t('No projects')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm text-gray-11">
        <Workflow className="size-4 shrink-0" />
        {t(
          'Pin a single flow to a worker group. Flows without a pin follow their project assignment.',
        )}
      </p>

      <DataTable
        columns={columns}
        page={page}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('flows')}
        onRetry={refetch}
        emptyStateTextTitle={t('No flows yet')}
        emptyStateTextDescription={t(
          'Flows created in this project will show up here',
        )}
        emptyStateIcon={<Workflow className="size-14" />}
        toolbarButtons={[projectSelector, searchBar]}
      />
    </div>
  );
}

function useProjectFlowsPage({
  projectId,
  cursor,
  limit,
  name,
}: {
  projectId: string | undefined;
  cursor: string | undefined;
  limit: string;
  name: string | undefined;
}) {
  return useQuery<SeekPage<PopulatedFlow>>({
    queryKey: ['worker-groups-flows', projectId, cursor, limit, name],
    queryFn: () =>
      api.get<SeekPage<PopulatedFlow>>('/v1/flows', {
        projectId,
        cursor,
        limit: Number(limit) || 10,
        name,
      }),
    enabled: !isNil(projectId),
  });
}

function buildColumns({ workerGroups }: { workerGroups: WorkerGroupInfo[] }) {
  return [
    {
      accessorKey: 'version.displayName',
      header: () => t('Flow'),
      cell: ({
        row,
      }: {
        row: { original: RowDataWithActions<PopulatedFlow> };
      }) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Workflow className="size-4 shrink-0 text-gray-11" />
          <TextWithTooltip tooltipMessage={row.original.version.displayName}>
            <p className="text-sm font-medium truncate">
              {row.original.version.displayName}
            </p>
          </TextWithTooltip>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => t('Status'),
      size: 100,
      cell: ({
        row,
      }: {
        row: { original: RowDataWithActions<PopulatedFlow> };
      }) => (
        <span className="text-sm text-gray-11">
          {row.original.status === FlowStatus.ENABLED
            ? t('Enabled')
            : t('Disabled')}
        </span>
      ),
    },
    {
      accessorKey: 'workerGroupId',
      header: () => t('Assigned worker'),
      size: 240,
      cell: ({
        row,
      }: {
        row: { original: RowDataWithActions<PopulatedFlow> };
      }) => (
        <FlowWorkerGroupCell row={row.original} workerGroups={workerGroups} />
      ),
    },
  ];
}

function FlowWorkerGroupCell({
  row,
  workerGroups,
}: {
  row: RowDataWithActions<PopulatedFlow>;
  workerGroups: WorkerGroupInfo[];
}) {
  const selectValue = row.workerGroupId ?? DEFAULT_SENTINEL;
  const isDefault = selectValue === DEFAULT_SENTINEL;
  const isOffline =
    !isNil(row.workerGroupId) &&
    !workerGroups.some((info) => info.label === row.workerGroupId);

  const handleChange = async (value: string) => {
    const workerGroupId = value === DEFAULT_SENTINEL ? null : value;
    try {
      await workersApi.assignFlow(row.id, workerGroupId);
      row.update({ workerGroupId });
      toast.success(t('Saved'));
    } catch {
      toast.error(t('Failed to save'));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Select value={selectValue} onValueChange={handleChange}>
        <SelectTrigger
          className={cn('w-[200px]', isOffline && 'border-danger-9')}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Cpu
              className={cn(
                'size-3.5 shrink-0',
                isOffline
                  ? 'text-danger-11'
                  : isDefault
                  ? 'text-gray-11'
                  : 'text-accent-11',
              )}
            />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_SENTINEL}>
            <span className="text-gray-11">{t('Default')}</span>
          </SelectItem>
          {isOffline && (
            <SelectItem value={row.workerGroupId!}>
              {row.workerGroupId!.replaceAll('_', ' ')}
            </SelectItem>
          )}
          {workerGroups.map((info) => (
            <SelectItem key={info.label} value={info.label}>
              {info.label.replaceAll('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isOffline && (
        <p className="text-xs text-danger-11">
          {t('{group} has no workers online. Runs will wait in its queue', {
            group: row.workerGroupId!.replaceAll('_', ' '),
          })}
        </p>
      )}
    </div>
  );
}

type ByFlowViewProps = {
  projects: ProjectWithLimits[];
  workerGroups: WorkerGroupInfo[];
};
