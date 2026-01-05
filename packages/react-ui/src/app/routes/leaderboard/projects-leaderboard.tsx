'use client';

import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Clock, LayoutGrid, Medal, Rocket, Workflow } from 'lucide-react';
import { useMemo } from 'react';

import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';

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
  if (index === 0) return <Medal className="w-5 h-5 text-yellow-500" />;
  if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
  if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
  return null;
};

const createColumns = (): ColumnDef<RowDataWithActions<ProjectStats>>[] => [
  {
    accessorKey: 'rank',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Rank')} icon={Medal} />
    ),
    cell: ({ row, table }) => {
      const sortedRows = table.getSortedRowModel().rows;
      const index = sortedRows.findIndex((r) => r.id === row.id);
      const rankIcon = getRankIcon(index);
      return (
        <div className="flex items-center gap-2 shrink-0">
          {rankIcon && <div>{rankIcon}</div>}
          <span className="text-sm text-foreground">#{index + 1}</span>
        </div>
      );
    },
    enableSorting: false,
    size: 60,
  },
  {
    accessorKey: 'projectName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Project')}
        icon={LayoutGrid}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <p className="h-8 flex items-center">{row.original.projectName}</p>
      </div>
    ),
  },
  {
    accessorKey: 'flowCount',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Active Flows')}
        icon={Workflow}
        sortable={true}
      />
    ),
    cell: ({ row }) => (
      <div className="text-left">{row.original.flowCount}</div>
    ),
  },
  {
    accessorKey: 'minutesSaved',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Time Saved')}
        icon={Clock}
        sortable={true}
      />
    ),
    cell: ({ row }) => (
      <div className="text-left">
        {formatUtils.formatToHoursAndMinutes(row.original.minutesSaved)}
      </div>
    ),
    sortingFn: (rowA, rowB) => {
      return rowA.original.minutesSaved - rowB.original.minutesSaved;
    },
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
      hidePagination={true}
      initialSorting={[{ id: 'flowCount', desc: true }]}
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
