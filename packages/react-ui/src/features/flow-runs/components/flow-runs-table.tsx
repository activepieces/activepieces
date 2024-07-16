import { ColumnDef } from '@tanstack/react-table';
import { CheckIcon } from 'lucide-react';

import {
  DataTable,
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { authenticationSession } from '@/lib/authentication-session';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { formatUtils } from '@/lib/utils';
import { FlowRun, FlowRunStatus } from '@activepieces/shared';

import { flowRunUtils } from '../lib/flow-run-utils';

const columns: ColumnDef<RowDataWithActions<FlowRun>>[] = [
  {
    accessorKey: 'flowDisplayName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Flow" />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.flowDisplayName}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const { varient, icon: Icon } = flowRunUtils.getStatusIcon(status);
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
    accessorKey: 'startTime',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Time" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.startTime))}
        </div>
      );
    },
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDuration(row.original.duration)}
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
    options: Object.values(FlowRunStatus)
      .filter((status) => status !== FlowRunStatus.STOPPED)
      .map((status) => {
        return {
          label: formatUtils.convertEnumToHumanReadable(status),
          value: status,
          icon: flowRunUtils.getStatusIcon(status).icon,
        };
      }),
    icon: CheckIcon,
  },
];

const fetchData = async (params: URLSearchParams) => {
  const status = params.getAll('status') as FlowRunStatus[];
  return flowRunsApi.list({
    projectId: authenticationSession.getProjectId(),
    status,
    cursor: params.get('cursor') ?? undefined,
    limit: parseInt(params.get('limit') ?? '10'),
  });
};

export default function FlowRunsTable() {
  return (
    <div className="container mx-auto flex-col py-10">
      <div className="mb-4 flex">
        <h1 className="text-3xl font-bold">Flow Runs</h1>
        <div className="ml-auto"></div>
      </div>
      <DataTable columns={columns} fetchData={fetchData} filters={filters} />
    </div>
  );
}
