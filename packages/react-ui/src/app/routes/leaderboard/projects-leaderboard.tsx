'use client';

import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ArrowDown, ArrowUp, ArrowUpDown, Folder, Medal, Trophy } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type ProjectsLeaderboardProps = {
  report?: PlatformAnalyticsReport;
  isLoading?: boolean;
};

type ProjectStats = {
  id: string;
  projectId: string;
  projectName: string;
  flowCount: number;
  minutesSaved: number;
};

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
  if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
  return (
    <span className="flex h-6 w-6 items-center justify-center text-sm font-semibold text-muted-foreground">
      {index + 1}
    </span>
  );
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
      return <div className="shrink-0">{getRankIcon(index)}</div>;
    },
    enableSorting: false,
    size: 60,
  },
  {
    accessorKey: 'projectName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Project')} icon={Folder} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Folder className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <p className="font-medium">{row.original.projectName}</p>
          <p className="text-sm text-muted-foreground">
            {t('Project')}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'flowCount',
    header: ({ column }) => {
      const sortDirection = column.getIsSorted();
      const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;
      
      return (
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
          className="h-auto p-0 hover:bg-transparent -ml-3"
        >
          {t('Flows')}
          <SortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-right font-semibold">{row.original.flowCount}</div>
    ),
  },
  {
    accessorKey: 'minutesSaved',
    header: ({ column }) => {
      const sortDirection = column.getIsSorted();
      const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;
      
      return (
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
          className="h-auto p-0 hover:bg-transparent -ml-3"
        >
          {t('Time Saved')}
          <SortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-right font-semibold">
        {formatUtils.formatToHoursAndMinutes(row.original.minutesSaved)}
      </div>
    ),
    sortingFn: (rowA, rowB) => {
      return rowA.original.minutesSaved - rowB.original.minutesSaved;
    },
  },
];

export function ProjectsLeaderboard({
  report,
  isLoading,
}: ProjectsLeaderboardProps) {
  const leaderboardData = useMemo(() => {
    if (!report?.flowsDetails) {
      return [];
    }

    const projectStatsMap = new Map<string, ProjectStats>();

    report.flowsDetails.forEach((flow) => {
      const existing = projectStatsMap.get(flow.projectId);
      if (existing) {
        existing.flowCount += 1;
        existing.minutesSaved += flow.minutesSaved;
      } else {
        projectStatsMap.set(flow.projectId, {
          id: flow.projectId,
          projectId: flow.projectId,
          projectName: flow.projectName,
          flowCount: 1,
          minutesSaved: flow.minutesSaved,
        });
      }
    });

    return Array.from(projectStatsMap.values());
  }, [report?.flowsDetails]);

  const columns = useMemo(() => createColumns(), []);

  const dataWithIds: ProjectStats[] = leaderboardData.map((project) => ({
    ...project,
    id: project.projectId,
  }));

  return (
    <DataTable
      columns={columns}
      page={{
        data: dataWithIds,
        next: null,
        previous: null,
      }}
      isLoading={isLoading ?? false}
      hidePagination={true}
      emptyStateTextTitle={t('No project data available yet')}
      emptyStateTextDescription={t(
        'Start creating flows to see project statistics',
      )}
      emptyStateIcon={<Folder className="h-10 w-10 text-muted-foreground" />}
      onRowClick={(row) => {
        window.open(`/projects/${row.projectId}`, '_blank');
      }}
    />
  );
}
