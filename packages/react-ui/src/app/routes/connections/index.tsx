import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Globe,
  AppWindow,
  Tag,
  User,
  Replace,
  Trash2,
  Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { ReplaceConnectionsDialog } from '@/app/connections/replace-connections-dialog';
import { ApAvatar } from '@/components/custom/ap-avatar';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EditGlobalConnectionDialog } from '@/features/connections/components/edit-global-connection-dialog';
import { RenameConnectionDialog } from '@/features/connections/components/rename-connection-dialog';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections/lib/app-connections-hooks';
import { appConnectionUtils } from '@/features/connections/lib/utils';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  Permission,
  PlatformRole,
} from '@activepieces/shared';

function AppConnectionsPage() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [selectedRows, setSelectedRows] = useState<
    Array<AppConnectionWithoutSensitiveData>
  >([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { checkAccess } = useAuthorization();
  const userPlatformRole = userHooks.getCurrentUserPlatformRole();
  const location = useLocation();
  const { pieces } = piecesHooks.usePieces({});
  const pieceOptions = (pieces ?? []).map((piece) => ({
    label: piece.displayName,
    value: piece.name,
  }));
  const projectId = authenticationSession.getProjectId()!;

  const searchParams = new URLSearchParams(location.search);
  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
  const limit = searchParams.get(LIMIT_QUERY_PARAM)
    ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
    : 10;
  const status = (searchParams.getAll('status') as AppConnectionStatus[]) ?? [];
  const pieceName = searchParams.get('pieceName') ?? undefined;
  const displayName = searchParams.get('displayName') ?? undefined;

  const {
    data: connections,
    isLoading: connectionsLoading,
    refetch,
  } = appConnectionsQueries.useAppConnections({
    request: {
      projectId,
      cursor,
      limit,
      status,
      pieceName,
      displayName,
    },
    extraKeys: [location.search, projectId],
  });

  const { mutateAsync: deleteConnections } =
    appConnectionsMutations.useBulkDeleteAppConnections(refetch);

  const filteredData = useMemo(() => {
    if (!connections?.data) return undefined;
    const searchParams = new URLSearchParams(location.search);
    const ownerEmails = searchParams.getAll('owner');

    if (ownerEmails.length === 0) return connections;

    return {
      data: connections.data.filter(
        (conn) => conn.owner && ownerEmails.includes(conn.owner.email),
      ),
      next: connections.next,
      previous: connections.previous,
    };
  }, [connections, location.search]);

  const userHasPermissionToWriteAppConnection = checkAccess(
    Permission.WRITE_APP_CONNECTION,
  );

  const { data: owners } = appConnectionsQueries.useConnectionsOwners();

  const ownersOptions = owners?.map((owner) => ({
    label: `${owner.firstName} ${owner.lastName} (${owner.email})`,
    value: owner.email,
  }));
  const filters = [
    {
      type: 'select',
      title: t('Status'),
      accessorKey: 'status',
      options: Object.values(AppConnectionStatus).map((status) => {
        return {
          label: formatUtils.convertEnumToHumanReadable(status),
          value: status,
        };
      }),
      icon: CheckIcon,
    } as const,
    {
      type: 'select',
      title: t('Pieces'),
      accessorKey: 'pieceName',
      icon: AppWindow,
      options: pieceOptions,
    } as const,
    {
      type: 'input',
      title: t('Name'),
      accessorKey: 'displayName',
      icon: Tag,
      options: [],
    } as const,
    {
      type: 'select',
      title: t('Owner'),
      accessorKey: 'owner',
      icon: User,
      options: ownersOptions ?? [],
    } as const,
  ];

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          variant="secondary"
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const allRows = table
                .getRowModel()
                .rows.map((row) => row.original)
                .filter((row) => row.scope !== AppConnectionScope.PLATFORM);

              const newSelectedRows = [...allRows, ...selectedRows];

              const uniqueRows = Array.from(
                new Map(
                  newSelectedRows.map((item) => [item.id, item]),
                ).values(),
              );

              setSelectedRows(uniqueRows);
            } else {
              const filteredRows = selectedRows.filter((row) => {
                return !table
                  .getRowModel()
                  .rows.some((r) => r.original.id === row.id);
              });
              setSelectedRows(filteredRows);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isPlatformConnection =
          row.original.scope === AppConnectionScope.PLATFORM;
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );
        return (
          <Checkbox
            variant="secondary"
            checked={isChecked}
            disabled={isPlatformConnection}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRows = [...selectedRows];
              if (isChecked) {
                const exists = newSelectedRows.some(
                  (selectedRow) => selectedRow.id === row.original.id,
                );
                if (!exists) {
                  newSelectedRows.push(row.original);
                }
              } else {
                newSelectedRows = newSelectedRows.filter(
                  (selectedRow) => selectedRow.id !== row.original.id,
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
      accessorKey: 'pieceName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('App')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <PieceIconWithPieceName pieceName={row.original.pieceName} />
          </div>
        );
      },
    },
    {
      accessorKey: 'displayName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        const isPlatformConnection = row.original.scope === 'PLATFORM';
        return (
          <div className="flex items-center gap-2">
            {isPlatformConnection && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Globe className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t(
                      'This connection is global and can be managed in the platform admin',
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            <CopyTextTooltip
              title={t('External ID')}
              text={row.original.externalId || ''}
            >
              <div className="text-left">{row.original.displayName}</div>
            </CopyTextTooltip>
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
        const status = row.original.status;
        const { variant, icon: Icon } =
          appConnectionUtils.getStatusIcon(status);
        return (
          <div className="text-left">
            <StatusIconWithText
              icon={Icon}
              text={formatUtils.convertEnumToHumanReadable(status)}
              variant={variant}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'updated',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Connected At')} />
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
      accessorKey: 'owner',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Owner')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.owner && (
              <ApAvatar
                type="user"
                includeName={true}
                size="small"
                userEmail={row.original.owner.email}
                fullName={
                  row.original.owner.firstName +
                  ' ' +
                  row.original.owner.lastName
                }
              />
            )}
            {!row.original.owner && <div className="text-left">-</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'flowCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Flows')} />
      ),
      cell: ({ row }) => {
        return (
          <div
            className="text-left underline cursor-pointer"
            onClick={() => {
              navigate(
                `/flows?connectionExternalId=${row.original.externalId}`,
              );
            }}
          >
            {row.original.flowIds?.length}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isPlatformConnection =
          row.original.scope === AppConnectionScope.PLATFORM;
        const userHasPermissionToRename = isPlatformConnection
          ? userPlatformRole === PlatformRole.ADMIN
          : userHasPermissionToWriteAppConnection;
        return (
          <div className="flex items-center gap-2 justify-end">
            {row.original.scope === AppConnectionScope.PROJECT ? (
              <RenameConnectionDialog
                connectionId={row.original.id}
                currentName={row.original.displayName}
                onRename={() => {
                  refetch();
                }}
                userHasPermissionToRename={userHasPermissionToRename}
              />
            ) : (
              <EditGlobalConnectionDialog
                connectionId={row.original.id}
                currentName={row.original.displayName}
                projectIds={row.original.projectIds}
                userHasPermissionToEdit={userHasPermissionToRename}
                onEdit={() => {
                  refetch();
                }}
              />
            )}
            <ReconnectButtonDialog
              hasPermission={userHasPermissionToRename}
              connection={row.original}
              onConnectionCreated={() => {
                refetch();
              }}
            />
          </div>
        );
      },
    },
  ];

  const bulkActions: BulkAction<AppConnectionWithoutSensitiveData>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          return (
            <>
              {selectedRows.length > 0 && (
                <ConfirmationDeleteDialog
                  title={t('Delete Connections')}
                  message={t(
                    'Are you sure you want to delete these connections? This action cannot be undone.',
                  )}
                  mutationFn={async () => {
                    await deleteConnections(selectedRows.map((row) => row.id));
                    refetch();
                    resetSelection();
                    setSelectedRows([]);
                  }}
                  entityName={t('connection')}
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                  showToast
                >
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('Delete')} ({selectedRows.length})
                  </Button>
                </ConfirmationDeleteDialog>
              )}
            </>
          );
        },
      },
      {
        render: () => {
          return (
            <div className="flex items-center gap-2">
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteAppConnection}
              >
                <ReplaceConnectionsDialog
                  projectId={projectId}
                  onConnectionMerged={() => {
                    setRefresh(refresh + 1);
                    refetch();
                  }}
                >
                  <Button
                    variant="outline"
                    disabled={!userHasPermissionToWriteAppConnection}
                  >
                    <Replace className="h-4 w-4" />
                    <span className="ml-2">{t('Replace')}</span>
                  </Button>
                </ReplaceConnectionsDialog>
              </PermissionNeededTooltip>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteAppConnection}
              >
                <NewConnectionDialog
                  isGlobalConnection={false}
                  onConnectionCreated={() => {
                    setRefresh(refresh + 1);
                    refetch();
                  }}
                >
                  <Button
                    variant="default"
                    disabled={!userHasPermissionToWriteAppConnection}
                  >
                    <Plus className="h-4 w-4" /> {t('New Connection')}
                  </Button>
                </NewConnectionDialog>
              </PermissionNeededTooltip>
            </div>
          );
        },
      },
    ],
    [userHasPermissionToWriteAppConnection, selectedRows, showDeleteDialog],
  );
  return (
    <div className="flex-col w-full">
      <DashboardPageHeader
        title={t('Connections')}
        description={t('Manage project connections to external systems.')}
      />
      <DataTable
        emptyStateTextTitle={t('No connections found')}
        emptyStateTextDescription={t(
          'Come back later when you create a automation to manage your connections',
        )}
        emptyStateIcon={<Globe className="size-14" />}
        columns={columns}
        page={filteredData}
        isLoading={connectionsLoading}
        filters={filters}
        bulkActions={bulkActions}
      />
    </div>
  );
}

export { AppConnectionsPage };
