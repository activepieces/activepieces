'use client';

import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Clock, LayoutGrid, Medal, Rocket, Workflow } from 'lucide-react';
import { useMemo } from 'react';

import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { FirstIcon } from './icons/1st-icon';
import { SecondIcon } from './icons/2nd-icon';
import { ThirdIcon } from './icons/3rd-icon';

export type ProjectStats = {
  id: string;
  projectId: string;
  projectName: string;
  flowCount: number;
  minutesSaved: number;
};

type ProjectsLeaderboardProps = {
  data: ProjectStats[];
  isLoading?: boolean;
};

const getRankIcon = (index: number) => {
  if (index === 0) return <FirstIcon className="size-6" />;
  if (index === 1) return <SecondIcon className="size-6" />;
  if (index === 2) return <ThirdIcon className="size-6" />;
  return null;
};

const getRankText = (index: number) => {
  return [0, 1, 2].includes(index) ? null : `#${index + 1}`;
};

const createColumns = (): ColumnDef<RowDataWithActions<ProjectStats>>[] => [
  {
    accessorKey: 'rank',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Rank')} />
    ),
    cell: ({ row, table }) => {
      const sortedRows = table.getSortedRowModel().rows;
      const index = sortedRows.findIndex((r) => r.id === row.id);
      const rankIcon = getRankIcon(index);
      return (
        <div className="flex items-center gap-2 shrink-0">
          {rankIcon && <div>{rankIcon}</div>}
          <span className="text-sm text-foreground">{getRankText(index)}</span>
        </div>
      );
    },
    enableSorting: false,
    size: 20,
  },
  {
    accessorKey: 'projectName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Projects')}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <p className="h-8 flex items-center">{row.original.projectName}</p>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'flowCount',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Active Flows')}
      />
    ),
    cell: ({ row }) => (
      <div className="text-left">{row.original.flowCount}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'minutesSaved',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Time Saved')}
      />
    ),
    cell: ({ row }) => (
      <div className="text-left">
        {formatUtils.formatToHoursAndMinutes(row.original.minutesSaved)}
      </div>
    ),
    enableSorting: false,
  },
];

export function ProjectsLeaderboard({
  data,
  isLoading,
}: ProjectsLeaderboardProps) {
  const columns = useMemo(() => createColumns(), []);

  return (
    <DataTable
      columns={columns}
      page={{
        data,
        next: null,
        previous: null,
      }}
      isLoading={isLoading ?? false}
      clientPagination={true}
      emptyStateTextTitle={t('No projects on the board yet')}
      emptyStateTextDescription={t(
        'Projects will rank here as flows are created and time is saved',
      )}
      emptyStateIcon={<Rocket className="h-10 w-10 text-muted-foreground" />}
      onRowClick={(row) => {
        window.open(`/projects/${row.projectId}`, '_blank');
      }}
    />
  );
}
