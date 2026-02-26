'use client';

import { BADGES, UserWithBadges } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Trophy } from 'lucide-react';
import { useMemo } from 'react';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatUtils } from '@/lib/utils';

import { RankCell } from './projects-leaderboard';

export type UserStats = {
  id: string;
  visibleId: string;
  userName: string;
  userEmail: string;
  flowCount: number;
  minutesSaved: number;
  badges?: UserWithBadges['badges'];
};

type UsersLeaderboardProps = {
  data: UserStats[];
  isLoading?: boolean;
};

const BadgesCell = ({
  badges,
  isTopRank,
}: {
  badges?: UserWithBadges['badges'];
  isTopRank: boolean;
}) => {
  if (!badges || badges.length === 0)
    return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex items-center gap-0.5">
      {badges.map((badge) => {
        const badgeInfo = BADGES[badge.name as keyof typeof BADGES];
        if (!badgeInfo) return null;
        return (
          <Tooltip key={badge.name}>
            <TooltipTrigger asChild>
              <img
                src={badgeInfo.imageUrl}
                alt={badgeInfo.title}
                className={cn(
                  'h-8 w-8 object-cover rounded-md transition-opacity',
                  !isTopRank && 'opacity-30 group-hover/leaderrow:opacity-100',
                )}
              />
            </TooltipTrigger>
            <TooltipContent className="text-left">
              <p className="font-semibold">{badgeInfo.title}</p>
              <p className="text-xs">{badgeInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

const createColumns = (): ColumnDef<RowDataWithActions<UserStats>>[] => [
  {
    accessorKey: 'rank',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Rank')} />
    ),
    cell: ({ row, table }) => {
      const sortedRows = table.getSortedRowModel().rows;
      const index = sortedRows.findIndex((r) => r.id === row.id);
      return <RankCell sortIndex={index} />;
    },
    enableSorting: false,
    size: 25,
  },
  {
    accessorKey: 'userName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('User')} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <ApAvatar
          id={row.original.visibleId}
          size="small"
          includeAvatar={true}
          includeName={true}
        />
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'flowCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Active Flows')} />
    ),
    cell: ({ row }) => (
      <div className="text-left">{row.original.flowCount}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'minutesSaved',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Time Saved')} />
    ),
    cell: ({ row }) => (
      <div className="text-left">
        {formatUtils.formatToHoursAndMinutes(row.original.minutesSaved)}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'badges',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Badges')} />
    ),
    cell: ({ row, table }) => {
      const sortedRows = table.getSortedRowModel().rows;
      const index = sortedRows.findIndex((r) => r.id === row.id);
      return <BadgesCell badges={row.original.badges} isTopRank={index < 3} />;
    },
    enableSorting: false,
  },
];

const getRowClassName = (
  _row: RowDataWithActions<UserStats>,
  index: number,
) => {
  if (index < 3) return 'group/leaderrow bg-primary/5 hover:bg-primary/10';
  return 'group/leaderrow hover:bg-accent';
};

export function UsersLeaderboard({ data, isLoading }: UsersLeaderboardProps) {
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
      getRowClassName={getRowClassName}
      emptyStateTextTitle={t('No automation heroes yet')}
      emptyStateTextDescription={t(
        'Once your team starts building flows, their achievements will shine here',
      )}
      emptyStateIcon={<Trophy className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
