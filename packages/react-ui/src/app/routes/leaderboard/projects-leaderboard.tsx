import { ColorName, PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Rocket } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar } from '@/components/ui/avatar';
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
  iconColor?: ColorName;
};

type ProjectsLeaderboardProps = {
  data: ProjectStats[];
  isLoading?: boolean;
};

export const getRankIcon = (index: number) => {
  if (index === 0) return <FirstIcon className="size-6" />;
  if (index === 1) return <SecondIcon className="size-6" />;
  if (index === 2) return <ThirdIcon className="size-6" />;
  return null;
};

export const getRankText = (index: number) => {
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
    size: 60,
  },
  {
    accessorKey: 'projectName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Projects')} />
    ),
    cell: ({ row }) => {
      const palette = row.original.iconColor
        ? PROJECT_COLOR_PALETTE[row.original.iconColor]
        : PROJECT_COLOR_PALETTE[ColorName.BLUE];
      return (
        <div className="flex items-center gap-2">
          <Avatar
            className="size-6 text-xs font-medium flex items-center justify-center rounded-sm shrink-0"
            style={{
              backgroundColor: palette.color,
              color: palette.textColor,
            }}
          >
            {row.original.projectName.charAt(0).toUpperCase()}
          </Avatar>
          <p className="h-8 flex items-center">{row.original.projectName}</p>
        </div>
      );
    },
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
];

const getRowClassName = (
  _row: RowDataWithActions<ProjectStats>,
  index: number,
) => {
  if (index < 3) return 'bg-primary/5';
  return '';
};

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
      getRowClassName={getRowClassName}
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
