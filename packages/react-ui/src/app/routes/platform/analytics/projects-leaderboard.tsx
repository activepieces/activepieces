import { PlatformProjectLeaderBoardRow } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon } from 'lucide-react';

import {
  DataTable,
  RowDataWithActions,
} from '../../../../components/ui/data-table';
import { DataTableColumnHeader } from '../../../../components/ui/data-table-column-header';
import { InfoTooltip } from '../../../../components/ui/info-tooltip';
import { analyticsApi } from '../../../../features/platform-admin-panel/lib/analytics-api';

const columns: ColumnDef<RowDataWithActions<PlatformProjectLeaderBoardRow>>[] =
  [
    {
      id: 'displayName',
      accessorKey: 'displayName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.displayName}</div>;
      },
    },
    {
      id: 'users',
      accessorKey: 'users',
      header: ({ column }) => (
        <div className="flex gap-1 items-center">
          <DataTableColumnHeader column={column} title={t('Users')} />
          <InfoTooltip>
            {t('All users in a project, not affected by date filter')}
          </InfoTooltip>
        </div>
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.users}</div>;
      },
    },
    {
      id: 'flows',
      accessorKey: 'flows',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Flows')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.flows}</div>;
      },
    },
    {
      id: 'publishes',
      accessorKey: 'publishes',
      header: ({ column }) => (
        <div className="flex gap-1 items-center">
          <DataTableColumnHeader column={column} title={t('Publishes')} />
          <InfoTooltip>
            {t('Total number of times a flow has been published')}
          </InfoTooltip>
        </div>
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.publishes}</div>;
      },
    },
    {
      id: 'flowEdits',
      accessorKey: 'flowEdits',
      header: ({ column }) => (
        <div className="flex gap-1 items-center">
          <DataTableColumnHeader column={column} title={t('Edits')} />
          <InfoTooltip>
            {t('Total number of times a flow has been edited')}
          </InfoTooltip>
        </div>
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.flowEdits}</div>;
      },
    },
    {
      id: 'tasks',
      accessorKey: 'tasks',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Tasks')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.tasks}</div>;
      },
    },
    {
      id: 'piecesUsed',
      accessorKey: 'piecesUsed',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Pieces Used')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.piecesUsed}</div>;
      },
    },
    {
      id: 'connections',
      accessorKey: 'connections',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Connections Created')}
        />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.connections}</div>;
      },
    },
  ];

const filters = [
  {
    type: 'date',
    title: t('Created'),
    accessorKey: 'created',
    options: [],
    icon: CheckIcon,
  } as const,
];
export const ProjectsLeaderBoard = () => {
  return (
    <div>
      <div className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row ">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <div className="text-xl font-semibold ">
            {t('Projects Leaderboard')}
          </div>
        </div>
      </div>
      <DataTable
        columns={columns}
        filters={filters}
        allowOrdering={true}
        hidePagination={true}
        fetchData={(_, pagination, order) => {
          return analyticsApi.listProjectsLeaderBoard({
            cursor: pagination.cursor,
            limit: 100,
            createdAfter: pagination.createdAfter,
            createdBefore: pagination.createdBefore,
            orderByColumn: order?.column,
            order: order?.order,
          });
        }}
      ></DataTable>
    </div>
  );
};
