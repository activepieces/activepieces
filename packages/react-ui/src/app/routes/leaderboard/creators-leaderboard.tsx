'use client';

import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Clock, Medal, Trophy, User, Workflow } from 'lucide-react';
import { useMemo } from 'react';

import {
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type CreatorsLeaderboardProps = {
  report?: PlatformAnalyticsReport;
  isLoading?: boolean;
};

type CreatorStats = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
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

const createColumns = (): ColumnDef<RowDataWithActions<CreatorStats>>[] => [
  {
    accessorKey: 'rank',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Rank')} icon={Medal} />
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
    accessorKey: 'userName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Creator')} icon={User} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
          {row.original.userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <p className="font-medium">{row.original.userName}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.userEmail}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'flowCount',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Flows')}
        icon={Workflow}
        sortable={true}
      />
    ),
    cell: ({ row }) => (
      <div className="text-right font-semibold">{row.original.flowCount}</div>
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
      <div className="text-right font-semibold">
        {formatUtils.formatToHoursAndMinutes(row.original.minutesSaved)}
      </div>
    ),
    sortingFn: (rowA, rowB) => {
      return rowA.original.minutesSaved - rowB.original.minutesSaved;
    },
  },
];

export function CreatorsLeaderboard({
  report,
  isLoading,
}: CreatorsLeaderboardProps) {
  const leaderboardData = useMemo(() => {
    if (!report?.flowsDetails || !report?.users) {
      return [];
    }

    const userMap = new Map(
      report.users.map((user) => [user.id, user]),
    );

    const creatorStatsMap = new Map<string, CreatorStats>();

    report.flowsDetails.forEach((flow) => {
      if (!flow.ownerId) return;

      const user = userMap.get(flow.ownerId);
      if (!user) return;

      const existing = creatorStatsMap.get(flow.ownerId);
      if (existing) {
        existing.flowCount += 1;
        existing.minutesSaved += flow.minutesSaved;
      } else {
        creatorStatsMap.set(flow.ownerId, {
          id: flow.ownerId,
          userId: flow.ownerId,
          userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
          userEmail: user.email,
          flowCount: 1,
          minutesSaved: flow.minutesSaved,
        });
      }
    });

    return Array.from(creatorStatsMap.values());
  }, [report?.flowsDetails, report?.users]);

  const columns = useMemo(() => createColumns(), []);

  const dataWithIds: CreatorStats[] = leaderboardData.map((creator) => ({
    ...creator,
    id: creator.userId,
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
      emptyStateTextTitle={t('No automation heroes yet')}
      emptyStateTextDescription={t(
        'Once your team starts building flows, their achievements will shine here',
      )}
      emptyStateIcon={<Trophy className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
