import { AppConnection, AppConnectionStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { CheckIcon, Trash } from 'lucide-react';

import { appConnectionUtils } from '../lib/app-connections-utils';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { authenticationSession } from '@/features/authentication/lib/authentication-session';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { formatUtils } from '@/lib/utils';

const columns: ColumnDef<RowDataWithActions<AppConnection>>[] = [
  {
    accessorKey: 'pieceName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="App" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <PieceIcon
            circle={true}
            size={'md'}
            border={true}
            pieceName={row.original.pieceName}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.name}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const { varient, icon: Icon } = appConnectionUtils.getStatusIcon(status);
      return (
        <div className="text-left">
          <StatusIconWithText
            icon={Icon}
            text={formatUtils.convertEnumToHumanReadable(status)}
            variant={varient}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      );
    },
  },
  {
    accessorKey: 'updated',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.updated))}
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-end justify-end">
          <ConfirmationDeleteDialog
            title={`Delete ${row.original.name} connection`}
            message="Are you sure you want to delete this connection? all steps using it will fail."
            onClose={() => {}}
            onConfirm={() => {}}
          >
            <Button variant="ghost" className="size-8 p-0">
              <Trash className="size-4" />
            </Button>
          </ConfirmationDeleteDialog>
        </div>
      );
    },
  },
];

const filters: DataTableFilter[] = [
  {
    type: 'select',
    title: 'Status',
    accessorKey: 'status',
    options: Object.values(AppConnectionStatus).map((status) => {
      return {
        label: formatUtils.convertEnumToHumanReadable(status),
        value: status,
      };
    }),
    icon: CheckIcon,
  },
];
const fetchData = async (queryParams: URLSearchParams) => {
  return appConnectionsApi.list({
    projectId: authenticationSession.getProjectId(),
    cursor: queryParams.get('cursor') ?? undefined,
    limit: parseInt(queryParams.get('limit') ?? '10'),
    status: queryParams.getAll('status') as AppConnectionStatus[],
  });
};

function AppConnectionsTable() {
  return (
    <div className="container mx-auto flex-col py-10">
      <div className="mb-4 flex">
        <h1 className="text-3xl font-bold">Connections </h1>
        <div className="ml-auto"></div>
      </div>
      <DataTable columns={columns} fetchData={fetchData} filters={filters} />
    </div>
  );
}
export { AppConnectionsTable };
