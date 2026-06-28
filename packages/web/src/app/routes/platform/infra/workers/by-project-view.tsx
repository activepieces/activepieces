import {
  SeekPage,
  UpdateProjectPlatformRequest,
  ProjectWithLimits,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { BarChart3, Cpu, Search, Server } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
import { WorkerGroupInfo } from '@/features/platform-admin/api/workers-api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { ProjectAvatar } from './project-avatar';

const SHARED_SENTINEL = '__shared__';

type ByProjectViewProps = {
  workerGroups: WorkerGroupInfo[];
  sharedSlots: number;
};

export function ByProjectView({
  workerGroups,
  sharedSlots,
}: ByProjectViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = searchParams.get('limit') ?? '10';
  const displayName = searchParams.get('displayName') ?? undefined;

  const queryClient = useQueryClient();

  const { data: page, isLoading } = usePlatformProjectsPage({
    cursor,
    limit,
    displayName,
  });

  const columns = useMemo(
    () => buildColumns({ workerGroups, sharedSlots, queryClient }),
    [workerGroups, sharedSlots, queryClient],
  );

  const searchBar = (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-8 w-[240px]"
        placeholder={t('Search projects')}
        defaultValue={displayName ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (value) {
                next.set('displayName', value);
              } else {
                next.delete('displayName');
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

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <BarChart3 className="size-4 shrink-0" />
        {t(
          'Allocate capacity per project — pick its worker group and concurrency limit. Leave the limit empty to inherit the platform default. Project settings shows these read-only and links here.',
        )}
      </p>

      <DataTable
        columns={columns}
        page={page}
        isLoading={isLoading}
        emptyStateTextTitle={t('No projects yet')}
        emptyStateTextDescription={t(
          'Start by creating projects to manage your automation teams',
        )}
        emptyStateIcon={<Server className="size-14" />}
        toolbarButtons={[searchBar]}
      />
    </div>
  );
}

function usePlatformProjectsPage({
  cursor,
  limit,
  displayName,
}: {
  cursor: string | undefined;
  limit: string;
  displayName: string | undefined;
}) {
  return useQuery<SeekPage<ProjectWithLimits>>({
    queryKey: ['platform-projects-page', cursor, limit, displayName],
    queryFn: () =>
      api.get<SeekPage<ProjectWithLimits>>('/v1/projects', {
        cursor,
        limit: Number(limit) || 10,
        displayName,
      }),
    meta: { showErrorDialog: true },
  });
}

function buildColumns({
  workerGroups,
  sharedSlots,
  queryClient,
}: {
  workerGroups: WorkerGroupInfo[];
  sharedSlots: number;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  return [
    {
      accessorKey: 'displayName',
      header: () => t('Project'),
      cell: ({
        row,
      }: {
        row: { original: RowDataWithActions<ProjectWithLimits> };
      }) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <ProjectAvatar project={row.original} />
          <TextWithTooltip tooltipMessage={row.original.displayName}>
            <p className="text-sm font-medium truncate">
              {row.original.displayName}
            </p>
          </TextWithTooltip>
        </div>
      ),
    },
    {
      accessorKey: 'analytics.totalFlows',
      header: () => t('Flows'),
      size: 100,
      cell: ({
        row,
      }: {
        row: { original: RowDataWithActions<ProjectWithLimits> };
      }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.analytics.totalFlows}
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
        row: { original: RowDataWithActions<ProjectWithLimits> };
      }) => (
        <WorkerGroupCell
          row={row.original}
          workerGroups={workerGroups}
          queryClient={queryClient}
        />
      ),
    },
    {
      accessorKey: 'maxConcurrentJobs',
      header: () => t('Concurrency limit'),
      size: 200,
      cell: ({
        row,
      }: {
        row: { original: RowDataWithActions<ProjectWithLimits> };
      }) => (
        <ConcurrencyCell
          row={row.original}
          workerGroups={workerGroups}
          sharedSlots={sharedSlots}
          queryClient={queryClient}
        />
      ),
    },
  ];
}

function WorkerGroupCell({
  row,
  workerGroups,
  queryClient,
}: {
  row: RowDataWithActions<ProjectWithLimits>;
  workerGroups: WorkerGroupInfo[];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const selectValue = row.workerGroupId ?? SHARED_SENTINEL;
  const isShared = selectValue === SHARED_SENTINEL;

  const handleChange = async (value: string) => {
    const workerGroupId = value === SHARED_SENTINEL ? null : value;
    const result = await saveProjectUpdate({
      projectId: row.id!,
      update: { workerGroupId },
    });
    if (result.success) {
      row.update({ workerGroupId });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('Saved'));
    } else {
      toast.error(t('Failed to save'));
    }
  };

  return (
    <Select value={selectValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2 min-w-0">
          <Cpu
            className={cn(
              'size-3.5 shrink-0',
              isShared ? 'text-muted-foreground' : 'text-primary',
            )}
          />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SHARED_SENTINEL}>
          <span className="text-muted-foreground">{t('Shared')}</span>
        </SelectItem>
        {workerGroups.map((info) => (
          <SelectItem key={info.label} value={info.label}>
            {info.label.replaceAll('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ConcurrencyCell({
  row,
  workerGroups,
  sharedSlots,
  queryClient,
}: {
  row: RowDataWithActions<ProjectWithLimits>;
  workerGroups: WorkerGroupInfo[];
  sharedSlots: number;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const assignedGroup = workerGroups.find(
    (info) => info.label === row.workerGroupId,
  );
  const poolSlots = assignedGroup ? assignedGroup.slots : sharedSlots;
  const concurrencyPlaceholder = t('Default {count}', { count: poolSlots });

  const [concurrencyInput, setConcurrencyInput] = useState(
    row.maxConcurrentJobs != null ? String(row.maxConcurrentJobs) : '',
  );

  const commitConcurrency = async () => {
    const parsed =
      concurrencyInput.trim() === '' ? null : parseInt(concurrencyInput, 10);
    if (parsed !== null && (isNaN(parsed) || parsed <= 0)) {
      toast.error(t('Concurrency limit must be a positive number'));
      setConcurrencyInput(
        row.maxConcurrentJobs != null ? String(row.maxConcurrentJobs) : '',
      );
      return;
    }
    const result = await saveProjectUpdate({
      projectId: row.id!,
      update: { maxConcurrentJobs: parsed },
    });
    if (result.success) {
      row.update({ maxConcurrentJobs: parsed });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('Saved'));
    } else {
      toast.error(t('Failed to save'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      className="w-[150px]"
      placeholder={concurrencyPlaceholder}
      value={concurrencyInput}
      onChange={(e) =>
        setConcurrencyInput(e.target.value.replace(/[^0-9]/g, ''))
      }
      onBlur={commitConcurrency}
      onKeyDown={handleKeyDown}
    />
  );
}

async function saveProjectUpdate({
  projectId,
  update,
}: {
  projectId: string;
  update: UpdateProjectPlatformRequest;
}): Promise<{ success: boolean }> {
  try {
    await api.post<ProjectWithLimits>(`/v1/projects/${projectId}`, update);
    return { success: true };
  } catch {
    return { success: false };
  }
}
