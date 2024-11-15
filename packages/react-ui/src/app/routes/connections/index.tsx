import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Trash, Pencil, Globe } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
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
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { UserFullName } from '@/components/ui/user-fullname';
import { RenameConnectionDialog } from '@/features/connections/components/rename-connection-dialog';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { appConnectionUtils } from '@/features/connections/lib/app-connections-utils';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  Permission,
} from '@activepieces/shared';

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
];

function AppConnectionsPage() {
  const [refresh, setRefresh] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<
    Array<AppConnectionWithoutSensitiveData>
  >([]);
  const { checkAccess } = useAuthorization();
  const { toast } = useToast();

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
        <DataTableColumnHeader column={column} title={t('Display Name')} />
      ),
      cell: ({ row }) => {
        const isPlatformConnection = row.original.scope === 'PLATFORM';
        return (
          <div className="flex items-center gap-2">
            {isPlatformConnection && (
              <Tooltip>
                <TooltipTrigger>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-left">{row.original.displayName}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t('External ID')}: {row.original.externalId || '-'}
                </p>
              </TooltipContent>
            </Tooltip>
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
              <UserFullName
                firstName={row.original.owner.firstName}
                lastName={row.original.owner.lastName}
                email={row.original.owner.email}
              />
            )}
            {!row.original.owner && <div className="text-left">-</div>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isPlatformConnection = row.original.scope === 'PLATFORM';
        return (
          <div className="flex items-center gap-2 justify-end">
            <PermissionNeededTooltip
              hasPermission={
                userHasPermissionToWriteAppConnection && !isPlatformConnection
              }
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <RenameConnectionDialog
                    connectionId={row.original.id}
                    currentName={row.original.displayName}
                    onRename={() => {
                      refetch();
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={
                        !userHasPermissionToWriteAppConnection ||
                        isPlatformConnection
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </RenameConnectionDialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isPlatformConnection
                      ? t('Platform connections cannot be renamed')
                      : t('Rename Connection')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </PermissionNeededTooltip>
            <ReconnectButtonDialog
              hasPermission={
                userHasPermissionToWriteAppConnection && !isPlatformConnection
              }
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
  const location = useLocation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['appConnections', location.search],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const searchParams = new URLSearchParams(location.search);
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      return appConnectionsApi.list({
        projectId: authenticationSession.getProjectId()!,
        cursor: cursor ?? undefined,
        limit,
        status: [],
      });
    },
  });

  const userHasPermissionToWriteAppConnection = checkAccess(
    Permission.WRITE_APP_CONNECTION,
  );

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => appConnectionsApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: t('Error deleting connections'),
        variant: 'destructive',
      });
    },
  });

  const bulkActions: BulkAction<AppConnectionWithoutSensitiveData>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteAppConnection}
              >
                <ConfirmationDeleteDialog
                  title={t('Confirm Deletion')}
                  message={t(
                    'Are you sure you want to delete the selected connections? This action cannot be undone.',
                  )}
                  entityName="connections"
                  mutationFn={async () => {
                    try {
                      await bulkDeleteMutation.mutateAsync(
                        selectedRows.map((row) => row.id),
                      );
                      resetSelection();
                      setSelectedRows([]);
                    } catch (error) {
                      console.error('Error deleting connections:', error);
                    }
                  }}
                >
                  {selectedRows.length > 0 && (
                    <Button
                      className="w-full mr-2"
                      onClick={() => setIsDialogOpen(true)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash className="mr-2 w-4" />
                      {`${t('Delete')} (${selectedRows.length})`}
                    </Button>
                  )}
                </ConfirmationDeleteDialog>
              </PermissionNeededTooltip>
            </div>
          );
        },
      },
      {
        render: () => {
          return (
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
                  size="sm"
                  disabled={!userHasPermissionToWriteAppConnection}
                >
                  {t('New Connection')}
                </Button>
              </NewConnectionDialog>
            </PermissionNeededTooltip>
          );
        },
      },
    ],
    [
      bulkDeleteMutation,
      userHasPermissionToWriteAppConnection,
      isDialogOpen,
      selectedRows,
    ],
  );
  return (
    <div className="flex-col w-full">
      <TableTitle
        description={t('Manage project connections to external systems.')}
      >
        {t('Connections')}
      </TableTitle>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        filters={filters}
        bulkActions={bulkActions}
      />
    </div>
  );
}

export { AppConnectionsPage };
