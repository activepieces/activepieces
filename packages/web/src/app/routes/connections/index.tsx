import {
  AppConnectionKind,
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  Permission,
  PlatformRole,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Globe,
  Trash2,
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
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { DeleteConnectionWarning } from '@/components/custom/global-connection-utils';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { PlusIcon } from '@/components/icons/plus';
import { ReplaceIcon } from '@/components/icons/replace';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  EditGlobalConnectionDialog,
  RenameConnectionDialog,
  appConnectionsMutations,
  appConnectionsQueries,
  appConnectionUtils,
} from '@/features/connections';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { ownerColumnHooks } from '@/hooks/owner-column-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';

import { CredentialsTab } from './credentials-tab';

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
      kind: AppConnectionKind.CONNECTION,
    },
    extraKeys: [location.search, projectId],
    showErrorDialog: true,
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
  const filters: DataTableFilters<keyof AppConnectionWithoutSensitiveData>[] =
    ownerColumnHooks.useOwnerColumnFilter<AppConnectionWithoutSensitiveData>(
      [
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
          icon: Puzzle,
        },
      ],
      4,
      owners,
    );

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = ownerColumnHooks.useOwnerColumn<AppConnectionWithoutSensitiveData>(
    [
      {
        accessorKey: 'displayName',
        size: 280,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Name')}
            icon={Puzzle}
          />
        ),
        cell: ({ row }) => {
          const isPlatformConnection = row.original.scope === 'PLATFORM';
          return (
            <div className="flex items-center gap-2">
              <CopyTextTooltip
                title={t('External ID')}
                text={row.original.externalId || ''}
              >
                <div className="flex items-center gap-2 w-fit">
                  <PieceIconWithPieceName
                    pieceName={row.original.pieceName ?? ''}
                    showTooltip={false}
                    size="sm"
                  />
                  <span className="truncate max-w-[120px] 2xl:max-w-[250px]">
                    {row.original.displayName}
                  </span>
                </div>
              </CopyTextTooltip>
              {isPlatformConnection && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Globe className="w-4 h-4 shrink-0" />
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
                  preSelectForNewProjects={
                    row.original.preSelectForNewProjects ?? false
                  }
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
    ],
    4,
  );

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
                    'The selected connections will be permanently deleted.',
                  )}
                  warning={<DeleteConnectionWarning />}
                  mutationFn={async () => {
                    await deleteConnections(selectedRows.map((row) => row.id));
                    refetch();
                    resetSelection();
                    setSelectedRows([]);
                  }}
                  entityName={t('connection')}
                  buttonText={t('Delete')}
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                  showToast
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('Delete')} ({selectedRows.length})
                  </Button>
                </ConfirmationDeleteDialog>
              )}
            </>
          );
        },
      },
    ],
    [selectedRows, showDeleteDialog],
  );

  const toolbarButtons = useMemo(
    () => [
      <PermissionNeededTooltip
        key="replace"
        hasPermission={userHasPermissionToWriteAppConnection}
      >
        <ReplaceConnectionsDialog
          projectId={projectId}
          onConnectionMerged={() => {
            setRefresh(refresh + 1);
            refetch();
          }}
        >
          <AnimatedIconButton
            icon={ReplaceIcon}
            iconSize={16}
            variant="outline"
            disabled={!userHasPermissionToWriteAppConnection}
          >
            {t('Replace')}
          </AnimatedIconButton>
        </ReplaceConnectionsDialog>
      </PermissionNeededTooltip>,
      <PermissionNeededTooltip
        key="new"
        hasPermission={userHasPermissionToWriteAppConnection}
      >
        <NewConnectionDialog
          isGlobalConnection={false}
          onConnectionCreated={() => {
            setRefresh(refresh + 1);
            refetch();
          }}
        >
          <AnimatedIconButton
            icon={PlusIcon}
            iconSize={16}
            size="sm"
            disabled={!userHasPermissionToWriteAppConnection}
          >
            {t('New Connection')}
          </AnimatedIconButton>
        </NewConnectionDialog>
      </PermissionNeededTooltip>,
    ],
    [userHasPermissionToWriteAppConnection, refresh],
  );
  return (
    <div className="flex-col w-full">
      <Tabs defaultValue="connections">
        <TabsList variant="outline" className="px-3 mt-2">
          <TabsTrigger value="connections" variant="outline">
            {t('Connections')}
          </TabsTrigger>
          <TabsTrigger value="credentials" variant="outline">
            {t('Credentials')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="connections">
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
            toolbarButtons={toolbarButtons}
          />
        </TabsContent>
        <TabsContent value="credentials">
          <CredentialsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { AppConnectionsPage };
