import {
  ProjectIcon,
  ProjectType,
  ProjectWithLimits,
  UpdateProjectPlatformRequest,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { FolderOpen } from 'lucide-react';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  refreshPlatformProjects,
  usePlatformProjects,
} from '@/app/routes/platform/projects/use-platform-projects';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { NameCell, NumberCell } from '@/components/custom/list/list-cells';
import { ListSearch, ListToolbar } from '@/components/custom/list/list-toolbar';
import { StatusDot } from '@/components/custom/status-dot';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkerGroupInfo } from '@/features/platform-admin/api/workers-api';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';

import { workerGroupUtils } from './machine-card';
import { ProjectAvatar } from './project-avatar';

export function ProjectGroupsTable({
  groups,
  sharedSlots,
  sampleRows,
}: {
  groups: WorkerGroupInfo[];
  sharedSlots: number;
  sampleRows?: ProjectGroupRow[];
}) {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '10') || 10;
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = usePlatformProjects({
    search,
    cursor,
    limit,
  });
  const updateProject = projectCollectionUtils.useUpdateProject(
    () => {
      refreshPlatformProjects(queryClient).catch(() => undefined);
      toast.success(t('Saved'));
    },
    () => toast.error(t('Could not save the change. Try again.')),
  );

  const save = ({
    row,
    request,
  }: {
    row: RowDataWithActions<ProjectGroupRow>;
    request: ProjectGroupPatch;
  }) => {
    if (sampleRows) {
      return;
    }
    row.update(request);
    updateProject.mutate({ projectId: row.id, request });
  };

  const rows = sampleRows ?? (data?.data ?? []).map(toRow);
  const columns = buildColumns({ groups, sharedSlots, save });

  return (
    <>
      <ListToolbar search={<ListSearch placeholder={t('Search projects')} />} />
      <DataTable
        columns={columns}
        page={
          sampleRows
            ? { data: rows, next: null, previous: null }
            : data && { data: rows, next: data.next, previous: data.previous }
        }
        hidePagination={sampleRows !== undefined}
        isLoading={!sampleRows && isLoading}
        isError={!sampleRows && isError}
        errorStateEntity={t('projects')}
        onRetry={refetch}
        emptyStateTextTitle={
          search.trim() !== '' ? t('No project matches') : t('No projects yet')
        }
        emptyStateTextDescription={
          search.trim() !== ''
            ? t('Try a different search.')
            : t('Projects appear here once someone creates one.')
        }
        emptyStateIcon={<FolderOpen />}
      />
    </>
  );
}

function buildColumns({
  groups,
  sharedSlots,
  save,
}: {
  groups: WorkerGroupInfo[];
  sharedSlots: number;
  save: (params: {
    row: RowDataWithActions<ProjectGroupRow>;
    request: ProjectGroupPatch;
  }) => void;
}): ColumnDef<RowDataWithActions<ProjectGroupRow>, unknown>[] {
  return [
    {
      accessorKey: 'displayName',
      header: () => t('Project'),
      cell: ({ row }) => (
        <NameCell
          media={<ProjectAvatar project={row.original} size="sm" />}
          title={row.original.displayName}
          sub={
            row.original.type === ProjectType.PERSONAL
              ? t('Personal')
              : undefined
          }
        />
      ),
    },
    {
      accessorKey: 'flows',
      size: 100,
      header: () => <span className="block text-right">{t('Flows')}</span>,
      cell: ({ row }) => <NumberCell value={row.original.flows} />,
    },
    {
      accessorKey: 'workerGroupId',
      size: 260,
      header: () => t('Runs on'),
      cell: ({ row }) => (
        <GroupPicker
          value={row.original.workerGroupId}
          groups={groups}
          onChange={(workerGroupId) =>
            save({ row: row.original, request: { workerGroupId } })
          }
        />
      ),
    },
    {
      accessorKey: 'maxConcurrentJobs',
      size: 200,
      header: () => t('Concurrent runs'),
      cell: ({ row }) => (
        <ConcurrencyInput
          key={`${row.original.id}-${row.original.maxConcurrentJobs ?? ''}`}
          value={row.original.maxConcurrentJobs}
          poolSlots={
            groups.find((group) => group.label === row.original.workerGroupId)
              ?.slots ?? sharedSlots
          }
          onCommit={(maxConcurrentJobs) =>
            save({ row: row.original, request: { maxConcurrentJobs } })
          }
        />
      ),
    },
  ];
}

function GroupPicker({
  value,
  groups,
  onChange,
}: {
  value: string | null;
  groups: WorkerGroupInfo[];
  onChange: (workerGroupId: string | null) => void;
}) {
  const offline =
    value !== null && !groups.some((group) => group.label === value);
  return (
    <Select
      value={value ?? SHARED_POOL}
      onValueChange={(next) => onChange(next === SHARED_POOL ? null : next)}
    >
      <SelectTrigger
        size="sm"
        className="w-52"
        aria-invalid={offline}
        onClick={(event) => event.stopPropagation()}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SHARED_POOL}>
          <StatusDot tone="neutral">{t('Shared pool')}</StatusDot>
        </SelectItem>
        {offline && value !== null && (
          <SelectItem value={value}>
            <StatusDot tone="danger">
              {t('{group} (no machines)', {
                group: workerGroupUtils.displayName(value),
              })}
            </StatusDot>
          </SelectItem>
        )}
        {groups.map((group) => (
          <SelectItem key={group.label} value={group.label}>
            <StatusDot tone="success">
              {workerGroupUtils.displayName(group.label)}
            </StatusDot>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ConcurrencyInput({
  value,
  poolSlots,
  onCommit,
}: {
  value: number | null;
  poolSlots: number;
  onCommit: (next: number | null) => void;
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  const commit = () => {
    const next = draft.trim() === '' ? null : Number(draft);
    if (next === value) {
      return;
    }
    if (next !== null && (!Number.isInteger(next) || next <= 0)) {
      setDraft(value === null ? '' : String(value));
      return;
    }
    onCommit(next);
  };
  return (
    <Input
      size="sm"
      inputMode="numeric"
      className="w-36 tabular-nums"
      aria-label={t('Concurrent runs')}
      placeholder={t('Default {count}', { count: poolSlots })}
      value={draft}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        const digits = event.target.value.replace(/[^0-9]/g, '');
        const capped =
          digits !== '' && poolSlots > 0
            ? String(Math.min(Number(digits), poolSlots))
            : digits;
        setDraft(capped);
      }}
      onBlur={commit}
      onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function toRow(project: ProjectWithLimits): ProjectGroupRow {
  return {
    id: project.id,
    displayName: project.displayName,
    type: project.type,
    icon: project.icon,
    flows: project.analytics.totalFlows,
    workerGroupId: project.workerGroupId ?? null,
    maxConcurrentJobs: project.maxConcurrentJobs ?? null,
  };
}

const SHARED_POOL = '__shared__';

type ProjectGroupPatch = Partial<
  Pick<ProjectGroupRow, 'workerGroupId' | 'maxConcurrentJobs'>
> &
  UpdateProjectPlatformRequest;

export type ProjectGroupRow = {
  id: string;
  displayName: string;
  type: ProjectType;
  icon: ProjectIcon;
  flows: number;
  workerGroupId: string | null;
  maxConcurrentJobs: number | null;
};
