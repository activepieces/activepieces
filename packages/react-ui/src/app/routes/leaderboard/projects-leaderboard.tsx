import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Clock, Folder, Medal, Workflow } from 'lucide-react';
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
import { LeaderboardProjectItem } from '@activepieces/shared';

type SortOption = 'flows' | 'timeSaved';

type ProjectsLeaderboardProps = {
  projects?: LeaderboardProjectItem[];
  isLoading: boolean;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
};

type ProjectWithRank = LeaderboardProjectItem & { rank: number };

const getMedalColor = (rank: number) => {
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

const columns: ColumnDef<RowDataWithActions<ProjectWithRank>>[] = [
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
    accessorKey: 'displayName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Project')} />
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center gap-2 cursor-pointer hover:underline"
        onClick={() =>
          window.open(`/projects/${row.original.id}`, '_blank')
        }
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.displayName}</span>
      </div>
    ),
  },
  {
    accessorKey: 'flowsCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Number of Flows')} />
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

export function ProjectsLeaderboard({
  projects,
  isLoading,
  sortBy,
  onSortChange,
}: ProjectsLeaderboardProps) {
  const sortedProjects = useMemo(() => {
    if (!projects) return [];

    const sorted = [...projects].sort((a, b) => {
      if (sortBy === 'flows') {
        return b.flowsCount - a.flowsCount;
      }
      return b.timeSaved - a.timeSaved;
    });

    return sorted.map((project, index) => ({
      ...project,
      rank: index + 1,
    }));
  }, [projects, sortBy]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('Top Projects')}</h3>
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
          data: sortedProjects,
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        hidePagination={true}
        emptyStateTextTitle={t('No Projects Yet')}
        emptyStateTextDescription={t(
          'Projects will appear here once flows are created',
        )}
        emptyStateIcon={<Folder className="h-10 w-10 text-muted-foreground" />}
      />
    </div>
  );
}

