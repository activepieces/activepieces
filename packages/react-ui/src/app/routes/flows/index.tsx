import { useQuery, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  ChevronDown,
  EllipsisVertical,
  Import,
  Plus,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useEmbedding, useNewWindow } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { SelectFlowTemplateDialog } from '@/features/flows/components/select-flow-template-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useFlowsBulkActions } from '@/features/flows/lib/use-flows-bulk-actions';
import { FolderBadge } from '@/features/folders/component/folder-badge';
import {
  FolderFilterList,
  folderIdParamName,
} from '@/features/folders/component/folder-filter-list';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils, NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import { FlowStatus, Permission, PopulatedFlow } from '@activepieces/shared';

import FlowActionMenu from '../../../app/components/flow-actions-menu';
import { TableTitle } from '../../../components/ui/table-title';

import TaskLimitAlert from './task-limit-alert';

const filters = [
  {
    type: 'input',
    title: t('Flow name'),
    accessorKey: 'name',
    options: [],
    icon: CheckIcon,
  } as const,
  {
    type: 'select',
    title: t('Status'),
    accessorKey: 'status',
    options: Object.values(FlowStatus).map((status) => {
      return {
        label: formatUtils.convertEnumToHumanReadable(status),
        value: status,
      };
    }),
    icon: CheckIcon,
  } as const,
];

const FlowsPage = () => {
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const { embedState } = useEmbedding();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const openNewWindow = useNewWindow();
  const [searchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId()!;
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flow-table', searchParams.toString(), projectId],
    staleTime: 0,
    queryFn: () => {
      const name = searchParams.get('name');
      const status = searchParams.getAll('status') as FlowStatus[];
      const cursor = searchParams.get('cursor');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;
      const folderId = searchParams.get('folderId') ?? undefined;

      return flowsApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        name: name ?? undefined,
        status,
        folderId,
      });
    },
  });

  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation<
    PopulatedFlow,
    Error,
    void
  >({
    mutationFn: async () => {
      const folderId = searchParams.get(folderIdParamName);
      const folder =
        folderId && folderId !== 'NULL'
          ? await foldersApi.get(folderId)
          : undefined;
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: t('Untitled'),
        folderName: folder?.displayName,
      });
      return flow;
    },
    onSuccess: (flow) => {
      navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`);
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const [selectedRows, setSelectedRows] = useState<Array<PopulatedFlow>>([]);

  const columns: (ColumnDef<RowDataWithActions<PopulatedFlow>> & {
    accessorKey: string;
  })[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const allRowIds = table
                .getRowModel()
                .rows.map((row) => row.original);

              const newSelectedRowIds = [...allRowIds, ...selectedRows];

              const uniqueRowIds = Array.from(
                new Map(
                  newSelectedRowIds.map((item) => [item.id, item])
                ).values()
              );

              setSelectedRows(uniqueRowIds);
            } else {
              const filteredRowIds = selectedRows.filter((row) => {
                return !table
                  .getRowModel()
                  .rows.some((r) => r.original.version.id === row.version.id);
              });
              setSelectedRows(filteredRowIds);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isChecked = selectedRows.some(
          (selectedRow) =>
            selectedRow.id === row.original.id &&
            selectedRow.status === row.original.status
        );
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRows = [...selectedRows];
              if (isChecked) {
                const exists = newSelectedRows.some(
                  (selectedRow) => selectedRow.id === row.original.id
                );
                if (!exists) {
                  newSelectedRows.push(row.original);
                }
              } else {
                newSelectedRows = newSelectedRows.filter(
                  (selectedRow) => selectedRow.id !== row.original.id
                );
              }
              setSelectedRows(newSelectedRows);
              row.toggleSelected(!!value);
            }}
          />
        );
      },
      accessorKey: 'select',
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        const status = row.original.version.displayName;
        return <div className="text-left">{status}</div>;
      },
    },
    {
      accessorKey: 'steps',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Steps')} />
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
        <DataTableColumnHeader column={column} title={t('Folder')} />
      ),
      cell: ({ row }) => {
        const folderId = row.original.folderId;
        return (
          <div className="text-left min-w-[150px]">
            {folderId ? (
              <FolderBadge folderId={folderId} />
            ) : (
              <span>{t('Uncategorized')}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => {
        const created = row.original.created;
        return (
          <div className="text-left font-medium min-w-[150px]">
            {formatUtils.formatDate(new Date(created))}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
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
              insideBuilder={false}
              flow={flow}
              readonly={false}
              flowVersion={flow.version}
              onRename={() => {
                setRefresh(refresh + 1);
                refetch();
              }}
              onMoveTo={() => {
                setRefresh(refresh + 1);
                refetch();
              }}
              onDuplicate={() => {
                setRefresh(refresh + 1);
                refetch();
              }}
              onDelete={() => {
                setSelectedRows((prev) =>
                  prev.filter((r) => r.id !== row.original.id)
                );
                setRefresh(refresh + 1);
                refetch();
              }}
            >
              <EllipsisVertical className="h-10 w-10" />
            </FlowActionMenu>
          </div>
        );
      },
    },
  ];

  const bulkActions = useFlowsBulkActions({
    selectedRows,
    isDropdownOpen,
    setIsDropdownOpen,
    refresh,
    setSelectedRows,
    setRefresh,
    refetch,
  });
  return (
    <div className="flex flex-col gap-4 grow">
      <TaskLimitAlert />
      <div className="flex flex-col gap-4 w-full grow">
        <div className="flex">
          <TableTitle
            description={t('Create and manage your automation flows')}
          >
            {t('Flows')}
          </TableTitle>
          <div className="ml-auto flex flex-row gap-2">
            <PermissionNeededTooltip
              hasPermission={doesUserHavePermissionToWriteFlow}
            >
              <ImportFlowDialog
                insideBuilder={false}
                onRefresh={() => {
                  setRefresh(refresh + 1);
                  refetch();
                }}
              >
                <Button
                  disabled={!doesUserHavePermissionToWriteFlow}
                  variant="outline"
                  className="flex gap-2 items-center"
                >
                  <Import className="w-4 h-4" />
                  {t('Import Flow')}
                </Button>
              </ImportFlowDialog>
            </PermissionNeededTooltip>

            <PermissionNeededTooltip
              hasPermission={doesUserHavePermissionToWriteFlow}
            >
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  disabled={!doesUserHavePermissionToWriteFlow}
                  asChild
                >
                  <Button
                    disabled={!doesUserHavePermissionToWriteFlow}
                    variant="default"
                    className="flex gap-2 items-center"
                    loading={isCreateFlowPending}
                  >
                    <span>{t('New Flow')}</span>
                    <ChevronDown className="h-4 w-4 " />
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
                    <span>{t('From scratch')}</span>
                  </DropdownMenuItem>
                  <SelectFlowTemplateDialog>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      disabled={isCreateFlowPending}
                    >
                      <Workflow className="h-4 w-4 me-2" />
                      <span>{t('Use a template')}</span>
                    </DropdownMenuItem>
                  </SelectFlowTemplateDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionNeededTooltip>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          {!embedState.hideFolders && <FolderFilterList refresh={refresh} />}
          <div className="w-full">
            <DataTable
              emptyStateTextTitle={t('No flows found')}
              emptyStateTextDescription={t(
                'Create a workflow to start automating',
              )}
              emptyStateIcon={<Workflow className="size-14" />}
              columns={columns.filter(
                (column) =>
                  !embedState.hideFolders || column.accessorKey !== 'folderId'
              )}
              page={data}
              isLoading={isLoading}
              filters={filters}
              bulkActions={bulkActions}
              onRowClick={(row, newWindow) => {
                if (newWindow) {
                  openNewWindow(
                    authenticationSession.appendProjectRoutePrefix(
                      `/flows/${row.id}`
                    )
                  );
                } else {
                  navigate(
                    authenticationSession.appendProjectRoutePrefix(
                      `/flows/${row.id}`
                    )
                  );
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { FlowsPage };
