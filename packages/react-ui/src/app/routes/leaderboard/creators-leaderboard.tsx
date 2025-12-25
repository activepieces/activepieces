import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Clock, Medal, User, Workflow } from 'lucide-react';
import { useMemo } from 'react';

import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatUtils } from '@/lib/utils';
import { LeaderboardCreatorItem } from '@activepieces/shared';

type SortOption = 'flows' | 'timeSaved';

type CreatorsLeaderboardProps = {
  creators?: LeaderboardCreatorItem[];
  isLoading: boolean;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
};

type CreatorWithRank = LeaderboardCreatorItem & { id: string; rank: number };

const getMedalColor = (rank: number) => {
  // dk if there is a variable for this
  switch (rank) {
    case 1:
      return 'text-yellow-500';
    case 2:
      return 'text-gray-400';
    case 3:
      return 'text-amber-600';
    default:
      return 'text-muted-foreground';
  }
};

const columns: ColumnDef<RowDataWithActions<CreatorWithRank>>[] = [
  {
    accessorKey: 'rank',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Rank')} />
    ),
    cell: ({ row }) => {
      const rank = row.original.rank;
      return (
        <div className="flex items-center gap-2">
          {rank <= 3 ? (
            <Medal className={`h-5 w-5 ${getMedalColor(rank)}`} />
          ) : (
            <span className="text-muted-foreground font-medium w-5 text-center">
              {rank}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Creator')} />
    ),
    cell: ({ row }) => {
      const creator = row.original;
      const displayName =
        creator.firstName && creator.lastName
          ? `${creator.firstName} ${creator.lastName}`
          : creator.email;
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{displayName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'flowsCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Flows Created')} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.flowsCount.toLocaleString()}</span>
      </div>
    ),
  },
  {
    accessorKey: 'timeSaved',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Time Saved')} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>{formatUtils.formatToHoursAndMinutes(row.original.timeSaved)}</span>
      </div>
    ),
  },
];

export function CreatorsLeaderboard({
  creators,
  isLoading,
  sortBy,
  onSortChange,
}: CreatorsLeaderboardProps) {
  const sortedCreators = useMemo(() => {
    if (!creators) return [];

    const sorted = [...creators].sort((a, b) => {
      if (sortBy === 'flows') {
        return b.flowsCount - a.flowsCount;
      }
      return b.timeSaved - a.timeSaved;
    });

    return sorted.map((creator, index) => ({
      ...creator,
      id: creator.id,
      rank: index + 1,
    }));
  }, [creators, sortBy]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('Top Creators')}</h3>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('Sort by')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flows">{t('Number of Flows')}</SelectItem>
            <SelectItem value="timeSaved">{t('Time Saved')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        page={{
          data: sortedCreators,
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        hidePagination={true}
        emptyStateTextTitle={t('No Creators Yet')}
        emptyStateTextDescription={t(
          'Creators will appear here once flows are created',
        )}
        emptyStateIcon={<User className="h-10 w-10 text-muted-foreground" />}
      />
    </div>
  );
}

