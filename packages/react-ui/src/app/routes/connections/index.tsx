import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Globe,
  Tag,
  User,
  Replace,
  Trash2,
  Plus,
  Clock,
  Activity,
  Workflow,
  Puzzle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { ReplaceConnectionsDialog } from '@/app/connections/replace-connections-dialog';
import { ApAvatar } from '@/components/custom/ap-avatar';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/ui/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/ui/formatted-date';
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
  const filters: DataTableFilters<keyof AppConnectionWithoutSensitiveData>[] = [
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
    },
    {
      type: 'select',
      title: t('Pieces'),
      accessorKey: 'pieceName',
      icon: Puzzle,
      options: pieceOptions,
    },
    {
      type: 'input',
      title: t('Name'),
      accessorKey: 'displayName',
      icon: Tag,
    },
    {
      type: 'select',
      title: t('Owner'),
      accessorKey: 'owner',
      icon: User,
      options: ownersOptions ?? [],
    },
  ];

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = [
    {
      accessorKey: 'pieceName',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Piece')}
          icon={Puzzle}
        />
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
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} icon={Tag} />
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
              <TruncatedColumnTextValue value={row.original.displayName} />
            </CopyTextTooltip>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Status')}
          icon={Activity}
        />
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
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Connected At')}
          icon={Clock}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <FormattedDate date={new Date(row.original.updated)} />
          </div>
        );
      },
    },
    {
      accessorKey: 'owner',
      size: 180,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Owner')} icon={User} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.owner && (
              <ApAvatar
                id={row.original.owner.id}
                includeAvatar={true}
                includeName={true}
                size="small"
              />
            )}
            {!row.original.owner && <div className="text-left">-</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'flowCount',
      size: 80,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Flows')}
          icon={Workflow}
        />
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
      size: 100,
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
        selectColumn={true}
        onSelectedRowsChange={setSelectedRows}
        bulkActions={bulkActions}
      />
    </div>
  );
}

export { AppConnectionsPage };
