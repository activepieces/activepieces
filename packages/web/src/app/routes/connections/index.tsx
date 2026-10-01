import { Permission } from '@activepieces/core-utils';
import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  PlatformRole,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Cable,
  CheckIcon,
  Copy,
  Globe,
  MoreHorizontal,
  Pencil,
  Plug,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  ProjectHeaderActions,
  ProjectHeaderMeta,
} from '@/app/components/project-layout/project-header-slots';
import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { ReplaceConnectionsDialog } from '@/app/connections/replace-connections-dialog';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { Page } from '@/components/custom/page';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { StatusDot } from '@/components/custom/status-dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyMedia } from '@/components/ui/empty';
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
    isError: connectionsError,
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
  const filters: DataTableFilters<keyof AppConnectionWithoutSensitiveData>[] =
    ownerColumnHooks.useOwnerColumnFilter<AppConnectionWithoutSensitiveData>(
      [
        {
          type: 'input',
          title: t('Name'),
          accessorKey: 'displayName',
          icon: Search,
        },
        {
          type: 'select',
          title: t('Status'),
          accessorKey: 'status',
          options: Object.values(AppConnectionStatus).map((status) => {
            return {
              label: STATUS_LABELS[status](),
              value: status,
            };
          }),
          icon: CheckIcon,
        },
        {
          type: 'select',
          title: t('Piece'),
          accessorKey: 'pieceName',
          icon: Puzzle,
          options: pieceOptions,
        },
      ],
      3,
      owners,
    );

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = ownerColumnHooks.useOwnerColumn<AppConnectionWithoutSensitiveData>(
    [
      {
        accessorKey: 'displayName',
        size: 360,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Name')} />
        ),
        cell: ({ row }) => {
          const isPlatformConnection =
            row.original.scope === AppConnectionScope.PLATFORM;
          const accountIdentifier =
            appConnectionUtils.getConnectionAccountIdentifier(row.original);
          return (
            <div className="flex min-w-0 items-center gap-3">
              <PieceIconWithPieceName
                pieceName={row.original.pieceName}
                showTooltip={false}
                size="sm"
              />
              <div className="flex min-w-0 flex-col">
                <div className="flex min-w-0 items-center gap-1.5">
                  <TextWithTooltip tooltipMessage={row.original.displayName}>
                    <span className="min-w-0 font-medium text-gray-12">
                      {row.original.displayName}
                    </span>
                  </TextWithTooltip>
                  {isPlatformConnection && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Globe
                          aria-label={t('Global connection')}
                          className="size-3.5 shrink-0 text-gray-11"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(
                          'This connection is global and can be managed in the platform admin',
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {accountIdentifier && (
                  <span className="truncate text-xs text-gray-11">
                    {accountIdentifier}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Status')} />
        ),
        cell: ({ row }) => (
          <StatusDot tone={STATUS_TONES[row.original.status]}>
            {STATUS_LABELS[row.original.status]()}
          </StatusDot>
        ),
      },
      {
        accessorKey: 'flowCount',
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Used by')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const count = row.original.flowIds?.length ?? 0;
          if (count === 0) {
            return <div className="text-right text-gray-11">{t('Unused')}</div>;
          }
          return (
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-md text-gray-12 tabular-nums outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-accent-8"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    `/automations?connection=${encodeURIComponent(
                      row.original.externalId,
                    )}`,
                  );
                }}
              >
                {t('{count, plural, =1 {1 flow} other {# flows}}', { count })}
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: 'updated',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Connected')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <FormattedDate
              date={new Date(row.original.updated)}
              className="text-gray-11 tabular-nums"
            />
          </div>
        ),
      },
      {
        id: 'actions',
        size: 56,
        cell: ({ row }) => {
          const isPlatformConnection =
            row.original.scope === AppConnectionScope.PLATFORM;
          const canEdit = isPlatformConnection
            ? userPlatformRole === PlatformRole.ADMIN
            : userHasPermissionToWriteAppConnection;
          return (
            <ConnectionRowActions
              connection={row.original}
              canEdit={canEdit}
              onChanged={() => refetch()}
            />
          );
        },
      },
    ],
    3,
  );

  const bulkActions: BulkAction<AppConnectionWithoutSensitiveData>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          const deletableRows = selectedRows.filter(
            (row) => row.scope === AppConnectionScope.PROJECT,
          );
          return (
            <>
              {deletableRows.length > 0 && (
                <ConfirmDialog
                  title={t('Delete connections?')}
                  description={t(
                    'The selected connections will be permanently deleted.',
                  )}
                  consequence={t('Flows using these connections will fail.')}
                  onConfirm={async () => {
                    await deleteConnections(deletableRows.map((row) => row.id));
                    refetch();
                    resetSelection();
                    setSelectedRows([]);
                  }}
                  confirmLabel={t('Delete')}
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                  successMessage={t('Deleted {name}', {
                    name: t('connection'),
                  })}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-11 hover:text-danger-11"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 />
                    {t('Delete')} ({deletableRows.length})
                  </Button>
                </ConfirmDialog>
              )}
            </>
          );
        },
      },
    ],
    [selectedRows, showDeleteDialog],
  );

  return (
    <Page>
      <ProjectHeaderMeta>
        {t(
          'Credentials your flows use to sign in to other apps. Only this project can see them.',
        )}
      </ProjectHeaderMeta>
      <ProjectHeaderActions>
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
              {t('Replace')}
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
            <Button disabled={!userHasPermissionToWriteAppConnection}>
              <Plus />
              {t('New connection')}
            </Button>
          </NewConnectionDialog>
        </PermissionNeededTooltip>
      </ProjectHeaderActions>
      <DataTable
        emptyStateTextTitle={t('No connections yet')}
        emptyStateTextDescription={t(
          'A connection is one set of credentials for one app. Every flow in this project can use it, so nobody pastes a key twice.',
        )}
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <Plug />
          </EmptyMedia>
        }
        columns={columns}
        page={filteredData}
        isLoading={connectionsLoading}
        isError={connectionsError}
        errorStateEntity={t('connections')}
        onRetry={refetch}
        filters={filters}
        selectColumn={true}
        onSelectedRowsChange={setSelectedRows}
        bulkActions={bulkActions}
      />
    </Page>
  );
}

const ConnectionRowActions = ({
  connection,
  canEdit,
  onChanged,
}: {
  connection: AppConnectionWithoutSensitiveData;
  canEdit: boolean;
  onChanged: () => void;
}) => {
  const [openDialog, setOpenDialog] = useState<'edit' | 'reconnect' | null>(
    null,
  );
  const { mutate: revalidate } =
    appConnectionsMutations.useRevalidateConnection();
  const isPlatformConnection = connection.scope === AppConnectionScope.PLATFORM;
  const closeDialog = (open: boolean) => {
    if (!open) {
      setOpenDialog(null);
    }
  };

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Actions for {name}', {
              name: connection.displayName,
            })}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            disabled={!canEdit}
            onSelect={() => setOpenDialog('reconnect')}
          >
            <Cable />
            {t('Reconnect')}
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onSelect={() => revalidate(connection.id)}>
              <RefreshCw />
              {t('Recheck connection')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={!canEdit}
            onSelect={() => setOpenDialog('edit')}
          >
            <Pencil />
            {isPlatformConnection ? t('Edit') : t('Rename')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard.writeText(connection.externalId);
              toast.success(t('External ID copied'));
            }}
          >
            <Copy />
            {t('Copy external ID')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isPlatformConnection ? (
        <EditGlobalConnectionDialog
          connectionId={connection.id}
          currentName={connection.displayName}
          projectIds={connection.projectIds}
          userHasPermissionToEdit={canEdit}
          onEdit={onChanged}
          preSelectForNewProjects={connection.preSelectForNewProjects ?? false}
          open={openDialog === 'edit'}
          onOpenChange={closeDialog}
        />
      ) : (
        <RenameConnectionDialog
          connectionId={connection.id}
          currentName={connection.displayName}
          onRename={onChanged}
          userHasPermissionToRename={canEdit}
          open={openDialog === 'edit'}
          onOpenChange={closeDialog}
        />
      )}
      <ReconnectButtonDialog
        hasPermission={canEdit}
        connection={connection}
        onConnectionCreated={onChanged}
        open={openDialog === 'reconnect'}
        onOpenChange={closeDialog}
      />
    </div>
  );
};

const STATUS_TONES: Record<
  AppConnectionStatus,
  'success' | 'warning' | 'danger'
> = {
  [AppConnectionStatus.ACTIVE]: 'success',
  [AppConnectionStatus.MISSING]: 'warning',
  [AppConnectionStatus.ERROR]: 'danger',
};

const STATUS_LABELS: Record<AppConnectionStatus, () => string> = {
  [AppConnectionStatus.ACTIVE]: () => t('Active'),
  [AppConnectionStatus.MISSING]: () => t('Missing'),
  [AppConnectionStatus.ERROR]: () => t('Error'),
};

export { AppConnectionsPage };
