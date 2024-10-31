import { useQuery, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  ChevronDown,
  CornerUpLeft,
  Download,
  EllipsisVertical,
  Import,
  Plus,
  Trash2,
  UploadCloud,
  Workflow,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding, useNewWindow } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { MoveFlowDialog } from '@/features/flows/components/move-flow-dialog';
import { SelectFlowTemplateDialog } from '@/features/flows/components/select-flow-template-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { flowsUtils } from '@/features/flows/lib/flows-utils';
import { FolderBadge } from '@/features/folders/component/folder-badge';
import {
  FolderFilterList,
  folderIdParamName,
} from '@/features/folders/component/folder-filter-list';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { PushToGitDialog } from '@/features/git-sync/components/push-to-git-dialog';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import { GitBranchType } from '@activepieces/ee-shared';
import { FlowStatus, Permission, PopulatedFlow } from '@activepieces/shared';

import FlowActionMenu from '../../../app/components/flow-actions-menu';
import { TableTitle } from '../../../components/ui/table-title';

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
  const openNewWindow = useNewWindow();
  const [searchParams] = useSearchParams();

  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.gitSyncEnabled,
  );
  const userHasPermissionToUpdateFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToPushToGit = checkAccess(Permission.WRITE_GIT_REPO);

  const isDevelopmentBranch =
    gitSync && gitSync.branchType === GitBranchType.DEVELOPMENT;

  const { mutate: exportFlows, isPending: isExportPending } = useMutation({
    mutationFn: async (flows: PopulatedFlow[]) => {
      const zip = await flowsUtils.downloadFlowsIntoZip(flows);
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'flows.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Flows have been exported.'),
        duration: 3000,
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['flow-table', window.location.search],
    staleTime: 0,
    queryFn: () => {
      const searchParams = new URLSearchParams(window.location.search);
      const name = searchParams.get('name');
      const status = searchParams.get('status');
      const cursor = searchParams.get('cursor');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;
      const folderId = searchParams.get('folderId') ?? undefined;

      return flowsApi.list({
        projectId: authenticationSession.getProjectId()!,
        cursor: cursor ?? undefined,
        limit,
        name: name ?? undefined,
        status: status
          ? status.split(',').map((s) => s as FlowStatus)
          : undefined,
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
      navigate(`/flows/${flow.id}`);
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const columns: (ColumnDef<RowDataWithActions<PopulatedFlow>> & {
    accessorKey: string;
  })[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
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

  const bulkActions: BulkAction<PopulatedFlow>[] = useMemo(
    () => [
      {
        render: (selectedRows, resetSelection) => {
          const isDisabled = selectedRows.length === 0;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild disabled={isDisabled}>
                  <Button
                    disabled={isDisabled}
                    className="h-9 w-full"
                    variant={'outline'}
                  >
                    {selectedRows.length > 0
                      ? `${t('Actions')} (${selectedRows.length})`
                      : t('Actions')}
                    <ChevronDown className="h-3 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToPushToGit}
                  >
                    <PushToGitDialog
                      flowIds={selectedRows.map((flow) => flow.id)}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToPushToGit}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex cursor-pointer  flex-row gap-2 items-center">
                          <UploadCloud className="h-4 w-4" />
                          <span>{t('Push to Git')}</span>
                        </div>
                      </DropdownMenuItem>
                    </PushToGitDialog>
                  </PermissionNeededTooltip>
                  {!embedState.hideFolders && (
                    <PermissionNeededTooltip
                      hasPermission={userHasPermissionToUpdateFlow}
                    >
                      <MoveFlowDialog
                        flows={selectedRows}
                        onMoveTo={() => {
                          setRefresh(refresh + 1);
                          resetSelection();
                        }}
                      >
                        <DropdownMenuItem
                          disabled={!userHasPermissionToUpdateFlow}
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex cursor-pointer  flex-row gap-2 items-center">
                            <CornerUpLeft className="h-4 w-4" />
                            <span>{t('Move To')}</span>
                          </div>
                        </DropdownMenuItem>
                      </MoveFlowDialog>
                    </PermissionNeededTooltip>
                  )}
                  <DropdownMenuItem onClick={() => exportFlows(selectedRows)}>
                    <div className="flex cursor-pointer flex-row gap-2 items-center">
                      {isExportPending ? (
                        <LoadingSpinner />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>
                        {isExportPending ? t('Exporting') : t('Export')}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToUpdateFlow}
                  >
                    <ConfirmationDeleteDialog
                      title={`${t('Delete')} Selected Flows`}
                      message={
                        <>
                          <div>
                            {t(
                              'Are you sure you want to delete these flows? This will permanently delete the flows, all their data and any background runs.',
                            )}
                          </div>
                          {isDevelopmentBranch && (
                            <div className="font-bold mt-2">
                              {t(
                                'You are on a development branch, this will not delete the flows from the remote repository.',
                              )}
                            </div>
                          )}
                        </>
                      }
                      mutationFn={async () => {
                        await Promise.all(
                          selectedRows.map((flow) => flowsApi.delete(flow.id)),
                        );
                      }}
                      entityName={t('flow')}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToUpdateFlow}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex cursor-pointer  flex-row gap-2 items-center">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="text-destructive">
                            {t('Delete')}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </ConfirmationDeleteDialog>
                  </PermissionNeededTooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [doesUserHavePermissionToWriteFlow, t],
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="mb-4 flex">
        <TableTitle>{t('Flows')}</TableTitle>
        <div className="ml-auto flex flex-row gap-2">
          <PermissionNeededTooltip
            hasPermission={doesUserHavePermissionToWriteFlow}
          >
            <ImportFlowDialog insideBuilder={false}>
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
      <div className="flex flex-row gap-4">
        {!embedState.hideFolders && <FolderFilterList />}
        <div className="w-full">
          <DataTable
            columns={columns.filter(
              (column) =>
                !embedState.hideFolders || column.accessorKey !== 'folderId',
            )}
            page={data}
            isLoading={isLoading}
            filters={filters}
            bulkActions={bulkActions}
            onRowClick={(row, newWindow) => {
              if (newWindow) {
                openNewWindow(`/flows/${row.id}`);
              } else {
                navigate(`/flows/${row.id}`);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export { FlowsPage };
