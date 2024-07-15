import { ColumnDef } from '@tanstack/react-table';
import { CheckIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { authenticationSession } from '@/features/authentication/lib/authentication-session';
import FlowStatusToggle from '@/features/flows/components/flow-status-toggle';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { FolderBadge } from '@/features/folders/component/folder-badge';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { formatUtils } from '@/lib/utils';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';

const columns: ColumnDef<RowDataWithActions<PopulatedFlow>>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const status = row.original.version.displayName;
      return <div className="text-left">{status}</div>;
    },
  },
  {
    accessorKey: 'steps',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Steps" />
    ),
    cell: ({ row }) => {
      return <PieceIconList flow={row.original} />;
    },
  },
  {
    accessorKey: 'folderId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Folder" />
    ),
    cell: ({ row }) => {
      const folderId = row.original.folderId;
      return (
        <div className="text-left">
          {folderId ? (
            <FolderBadge folderId={folderId} />
          ) : (
            <span>Uncategorized</span>
          )}
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
      const created = row.original.created;
      return (
        <div className="text-left font-medium">
          {formatUtils.formatDate(new Date(created))}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      return <FlowStatusToggle flow={row.original} />;
    },
  },
];

const filters: DataTableFilter[] = [
  {
    type: 'select',
    title: 'Status',
    accessorKey: 'status',
    options: Object.values(FlowStatus).map((status) => {
      return {
        label: formatUtils.convertEnumToHumanReadable(status),
        value: status,
      };
    }),
    icon: CheckIcon,
  },
];

async function fetchData(queryParams: URLSearchParams) {
  return flowsApi.list({
    projectId: authenticationSession.getProjectId(),
    cursor: queryParams.get('cursor') ?? undefined,
    limit: parseInt(queryParams.get('limit') ?? '10'),
    status: (queryParams.getAll('status') ?? []) as FlowStatus[],
  });
}

const FlowsTable = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto  flex-col">
      <div className="mb-4 flex">
        <h1 className="text-3xl font-bold">Flows</h1>
        <div className="ml-auto">
          <Link to="/builder">
            <Button variant="default">New flow</Button>
          </Link>
        </div>
      </div>
      <DataTable
        columns={columns}
        fetchData={fetchData}
        filters={filters}
        onRowClick={(row) => navigate(`/flows/${row.id}`)}
      />
    </div>
  );
};

export { FlowsTable };
