import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  Permission,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  ChevronDown,
  PlayIcon,
  RotateCw,
  Trash,
} from 'lucide-react';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';

import { TableTitle } from '../../components/ui/table-title';
import { appConnectionUtils } from '../../features/connections/lib/app-connections-utils';

import { NewConnectionDialog } from './new-connection-dialog';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { toast, useToast } from '@/components/ui/use-toast';
import { UserFullName } from '@/components/ui/user-fullname';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';

type PieceIconWithPieceNameProps = {
  pieceName: string;
};
const PieceIconWithPieceName = ({ pieceName }: PieceIconWithPieceNameProps) => {
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName,
  });

  return (
    <PieceIcon
      circle={true}
      size={'md'}
      border={true}
      displayName={pieceModel?.displayName}
      logoUrl={pieceModel?.logoUrl}
      showTooltip={true}
    />
  );
};

const DeleteConnectionColumn = ({
  row,
  setRefresh,
}: {
  row: RowDataWithActions<AppConnectionWithoutSensitiveData>;
  setRefresh: Dispatch<SetStateAction<number>>;
}) => {
  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteAppConnection = checkAccess(
    Permission.WRITE_APP_CONNECTION,
  );
  return (
    <div className="flex items-end justify-end">
      <PermissionNeededTooltip
        hasPermission={userHasPermissionToWriteAppConnection}
      >
        <ConfirmationDeleteDialog
          title={t('Delete {name}', { name: row.name })}
          message={t(
            'Are you sure you want to delete this connection? all steps using it will fail.',
          )}
          mutationFn={() =>
            appConnectionsApi.delete(row.id).then((data) => {
              setRefresh((prev) => prev + 1);
              return data;
            })
          }
          entityName={row.name}
        >
          <Button
            disabled={!userHasPermissionToWriteAppConnection}
            variant="ghost"
            className="size-8 p-0"
          >
            <Trash className="size-4 stroke-destructive" />
          </Button>
        </ConfirmationDeleteDialog>
      </PermissionNeededTooltip>
    </div>
  );
};
const columns: (
  setRefresh: Dispatch<SetStateAction<number>>,
) => ColumnDef<RowDataWithActions<AppConnectionWithoutSensitiveData>>[] = (
  setRefresh,
) => {
  return [
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
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.name}</div>;
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
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {formatUtils.formatDate(new Date(row.original.created))}
          </div>
        );
      },
    },
    {
      accessorKey: 'updated',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Updated')} />
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
      accessorKey: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        return (
          <DeleteConnectionColumn row={row.original} setRefresh={setRefresh} />
        );
      },
    },
  ];
};

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

function AppConnectionsTable() {
  const [refresh, setRefresh] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { checkAccess } = useAuthorization();
  const { toast } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['appConnections'],
    staleTime: 0,
    queryFn: () => {
      const searchParams = new URLSearchParams(window.location.search);
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
      toast({
        title: t('Connections deleted successfully'),
        variant: 'default',
      });
      setSelectedRows(new Set());
      refetch(); // Refresh the DataTable
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
        render: (selectedRows, resetSelection) => {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteAppConnection}
              >
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('Confirm Deletion')}</DialogTitle>
                      <DialogDescription>
                        {t(
                          'Are you sure you want to delete the selected connections? This action cannot be undone.',
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="default"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        {t('Cancel')}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          bulkDeleteMutation.mutate(
                            selectedRows.map((row) => row.id),
                          );
                          resetSelection();
                          setIsDialogOpen(false);
                        }}
                      >
                        {t('Delete')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </PermissionNeededTooltip>
            </div>
          );
        },
      },
    ],
    [
      bulkDeleteMutation,
      userHasPermissionToWriteAppConnection,
      t,
      isDialogOpen,
    ],
  );
  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <TableTitle>{t('Connections')}</TableTitle>
        <div className="ml-auto flex">
          {selectedRows.size > 0 && (
            <Button
              className="h-10 w-full bg-red-500 hover:bg-red-600 text-white mr-2"
              onClick={() => setIsDialogOpen(true)}
              variant="destructive"
            >
              <Trash className="mr-2 h-3 w-4" />
              {`${t('Delete')} (${selectedRows.size})`}
            </Button>
          )}
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToWriteAppConnection}
          >
            <NewConnectionDialog
              onConnectionCreated={() => {
                setRefresh(refresh + 1);
                refetch();
              }}
            >
              <Button
                variant="default"
                disabled={!userHasPermissionToWriteAppConnection}
              >
                {t('New Connection')}
              </Button>
            </NewConnectionDialog>
          </PermissionNeededTooltip>
        </div>
      </div>
      <DataTable
        columns={columns(setRefresh)}
        page={data}
        isLoading={isLoading}
        filters={filters}
        bulkActions={bulkActions}
        onSelectedRowsChange={(rows) => {
          const selectedIds = new Set(rows.map((row) => row.id));
          setSelectedRows(selectedIds);
        }}
      />
    </div>
  );
}

export { AppConnectionsTable };
