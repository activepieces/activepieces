import {
  FlowOperationType,
  FlowStatus,
  FlowVersion,
  PopulatedFlow,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  CheckIcon,
  Copy,
  Download,
  EllipsisVertical,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { flowsHooks } from '../lib/flows-hooks';
import { flowsUtils } from '../lib/flows-utils';

import { DeleteFlowDialog } from './delete-flow-dialog';
import { RenameFlowDialog } from './rename-flow-dialog';
import { ShareTemplateDialog } from './share-template-dialog';

import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import FlowStatusToggle from '@/features/flows/components/flow-status-toggle';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { FolderBadge } from '@/features/folders/component/folder-badge';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';

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

const FlowsTable = () => {
  const navigate = useNavigate();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<{
    flowId: string;
    flowName: string;
    flowVersion?: FlowVersion;
  }>({
    flowId: '',
    flowName: '',
    flowVersion: undefined,
  });

  const { refetch } = flowsHooks.useFlowsListing();

  async function fetchData(queryParams: URLSearchParams) {
    return flowsApi.list({
      projectId: authenticationSession.getProjectId(),
      cursor: queryParams.get('cursor') ?? undefined,
      limit: parseInt(queryParams.get('limit') ?? '10'),
      status: (queryParams.getAll('status') ?? []) as FlowStatus[],
    });
  }

  const { mutate: duplicateFlow } = useMutation({
    mutationFn: async (flowId: string) => {
      const flow = await flowsApi.get(flowId);
      const createdFlow = await flowsApi.create({
        displayName: flow.version.displayName,
        projectId: authenticationSession.getProjectId(),
      });
      const updatedFlow = await flowsApi.update(createdFlow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: createdFlow.version.displayName,
          trigger: createdFlow.version.trigger,
        },
      });
      return updatedFlow;
    },
    onSuccess: (data) => {
      window.open(`/flows/${data.id}`, '_blank', 'rel=noopener noreferrer');
      refetch();
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const exportFlow = async (flowId: string) => {
    const flow = await flowsApi.get(flowId);
    const template = await flowsApi.getTemplate(flow.id, {});
    flowsUtils.downloadFlow(template);
  };

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
      window.open(`/flows/${flow.id}`, '_blank', 'noopener');
      refetch();
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const selectedFlowSetter = (
    flowId: string,
    flowName: string,
    flowVersion: FlowVersion,
  ) => {
    setSelectedFlow((prev) => ({
      ...prev,
      flowId,
      flowName,
      flowVersion,
    }));
  };

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
        return (
          <div
            className="flex items-center space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <FlowStatusToggle flow={row.original} />
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
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="p-2 rounded-full hover:bg-muted">
                <EllipsisVertical className="h-6 w-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    selectedFlowSetter(
                      row.original.id,
                      row.original.version.displayName,
                      row.original.version,
                    );
                    setIsRenameDialogOpen(true);
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <Pencil className="h-4 w-4" />
                    <span>Rename</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => duplicateFlow(row.original.id)}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <Copy className="h-4 w-4" />
                    <span>Duplicate</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFlow(row.original.id)}>
                  <div className="flex flex-row gap-2 items-center">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    selectedFlowSetter(
                      row.original.id,
                      row.original.version.displayName,
                      row.original.version,
                    );
                    setIsShareDialogOpen(true);
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    selectedFlowSetter(
                      row.original.id,
                      row.original.version.displayName,
                      row.original.version,
                    );
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">Delete</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <h1 className="text-3xl font-bold">Flows</h1>
        <div className="ml-auto">
          <Button
            variant="default"
            onClick={() => createFlow()}
            loading={isCreateFlowPending}
          >
            New flow
          </Button>
        </div>
      </div>
      <Dialog
        open={isRenameDialogOpen || isShareDialogOpen || isDeleteDialogOpen}
        onOpenChange={(isOpen) => {
          setIsRenameDialogOpen(isOpen);
          setIsShareDialogOpen(isOpen);
          setIsDeleteDialogOpen(isOpen);
        }}
      >
        {isRenameDialogOpen && (
          <RenameFlowDialog
            flowId={selectedFlow.flowId}
            setIsRenameDialogOpen={setIsRenameDialogOpen}
            onRename={() => refetch()}
          />
        )}
        {isShareDialogOpen && selectedFlow.flowVersion && (
          <ShareTemplateDialog
            flowId={selectedFlow.flowId}
            flowVersion={selectedFlow.flowVersion}
            setIsShareDialogOpen={setIsShareDialogOpen}
          />
        )}
        {isDeleteDialogOpen && selectedFlow.flowVersion && (
          <DeleteFlowDialog
            flowId={selectedFlow.flowId}
            flowVersion={selectedFlow.flowVersion}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            onDelete={() => refetch()}
          />
        )}
      </Dialog>
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
