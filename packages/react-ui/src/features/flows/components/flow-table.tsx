import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  CheckIcon,
  ChevronDown,
  EllipsisVertical,
  Import,
  Plus,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { FolderBadge } from '@/features/folders/component/folder-badge';
import { FolderFilterList } from '@/features/folders/component/folder-filter-list';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';

import FlowActionMenu from './flow-actions-menu';
import { FlowStatusToggle } from './flow-status-toggle';
import { ImportFlowDialog } from './import-flow-dialog';
import { SelectFlowTemplateDialog } from './select-flow-template-dialog';

const filters: DataTableFilter[] = [
  {
    type: 'input',
    title: 'Flow name',
    accessorKey: 'name',
    options: [],
    icon: CheckIcon,
  },
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

const FlowsTable = () => {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  async function fetchData(queryParams: URLSearchParams) {
    return flowsApi.list({
      projectId: authenticationSession.getProjectId(),
      cursor: queryParams.get('cursor') ?? undefined,
      limit: parseInt(queryParams.get('limit') ?? '10'),
      status: (queryParams.getAll('status') ?? []) as FlowStatus[],
      name: queryParams.get('name') ?? undefined,
      folderId: queryParams.get('folderId') ?? undefined,
    });
  }

  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation<
    PopulatedFlow,
    Error,
    void
  >({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId(),
        displayName: 'Untitled',
      });
      return flow;
    },
    onSuccess: (flow) => {
      navigate(`/flows/${flow.id}`);
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

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
        return (
          <PieceIconList
            trigger={row.original.version.trigger}
            maxNumberOfIconsToShow={2}
          />
        );
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
        return (
          <div
            className="flex items-center space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <FlowStatusToggle
              flow={row.original}
              flowVersion={row.original.version}
            ></FlowStatusToggle>
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        const flow = row.original;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <FlowActionMenu
              flow={flow}
              readonly={false}
              flowVersion={flow.version}
              onRename={() => setRefresh(refresh + 1)}
              onMoveTo={() => setRefresh(refresh + 1)}
              onDuplicate={() => setRefresh(refresh + 1)}
              onDelete={() => setRefresh(refresh + 1)}
            >
              <EllipsisVertical className="h-10 w-10" />
            </FlowActionMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-row gap-4 w-full">
      <div className="flex flex-col w-full">
        <div className="mb-4 flex">
          <h1 className="text-3xl font-bold">Flows</h1>
          <div className="ml-auto flex flex-row gap-2">
            <ImportFlowDialog>
              <Button variant="outline">
                <Import className="w-4 h-4 mr-2" />
                Import Flow
              </Button>
            </ImportFlowDialog>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="default" loading={isCreateFlowPending}>
                  <span>New flow</span>
                  <ChevronDown className="h-4 w-4 ms-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    createFlow();
                  }}
                  disabled={isCreateFlowPending}
                >
                  <Plus className="h-4 w-4 me-2" />
                  <span>From scratch</span>
                </DropdownMenuItem>
                <SelectFlowTemplateDialog>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    disabled={isCreateFlowPending}
                  >
                    <Workflow className="h-4 w-4 me-2" />
                    <span>Use a template</span>
                  </DropdownMenuItem>
                </SelectFlowTemplateDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-row gap-4">
          <FolderFilterList />
          <div className="w-full">
            <DataTable
              columns={columns}
              fetchData={fetchData}
              filters={filters}
              refresh={refresh}
              onRowClick={(row) => navigate(`/flows/${row.id}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { FlowsTable };
