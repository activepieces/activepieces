import { FlowRun, FlowRunStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { CheckIcon } from 'lucide-react';

import { flowRunUtils } from '../lib/flow-run-utils';

import {
  DataTable,
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';

const columns: ColumnDef<RowDataWithActions<FlowRun>>[] = [
  {
    accessorKey: 'flowId',
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
      const { varient, Icon } = flowRunUtils.getStatusIcon(status);
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

const fetchData = async (params: URLSearchParams) => {
  const status = params.getAll('status') as FlowRunStatus[];
  return flowRunsApi.list({
    status,
    projectId: authenticationSession.getProjectId(),
    flowId: params.get('flowId') ?? undefined,
    cursor: params.get('cursor') ?? undefined,
    limit: parseInt(params.get('limit') ?? '10'),
    createdAfter: params.get('createdAfter') ?? undefined,
    createdBefore: params.get('createdBefore') ?? undefined,
  });
};

export default function FlowRunsTable() {
  const { data } = flowsHooks.useFlows();

  const flows = data?.data.map((flow) => flow);

  const filters: DataTableFilter[] = [
    {
      type: 'select',
      title: 'Flow name',
      accessorKey: 'flowId',
      options:
        flows?.map((flow) => ({
          label: flow.version.displayName,
          value: flow.id,
        })) || [],
      icon: CheckIcon,
    },
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
            icon: flowRunUtils.getStatusIcon(status).Icon,
          };
        }),
      icon: CheckIcon,
    },
    {
      type: 'date',
      title: 'Created',
      accessorKey: 'created',
      options: [],
      icon: CheckIcon,
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <h1 className="text-3xl font-bold">Flow Runs</h1>
        <div className="ml-auto"></div>
      </div>
      <DataTable columns={columns} fetchData={fetchData} filters={filters} />
    </div>
  );
}
