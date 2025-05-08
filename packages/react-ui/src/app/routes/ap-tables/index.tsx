import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Trash2, Plus, CheckIcon, Table2, UploadCloud } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { PushToGitDialog } from '@/features/git-sync/components/push-to-git-dialog';
import { ApTableActionsMenu } from '@/features/tables/components/ap-table-actions-menu';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { api } from '@/lib/api';
import { useNewWindow } from '@/lib/navigation-utils';
import { formatUtils, NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import { ApFlagId, FieldType, Permission, Table } from '@activepieces/shared';

const ApTablesPage = () => {
  const openNewWindow = useNewWindow();
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<Table[]>([]);
  const { data: maxTables } = flagsHooks.useFlag(
    ApFlagId.MAX_TABLES_PER_PROJECT,
  );
  const { data: project } = projectHooks.useCurrentProject();
  const [searchParams] = useSearchParams();
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tables', searchParams.toString(), project.id],
    queryFn: () =>
      tablesApi.list({
        cursor: searchParams.get('cursor') ?? undefined,
        limit: searchParams.get('limit')
          ? parseInt(searchParams.get('limit')!)
          : undefined,
        name: searchParams.get('name') ?? undefined,
      }),
  });
  const { mutate: createTable, isPending: isCreatingTable } = useMutation({
    mutationFn: async (data: { name: string }) => {
      const table = await tablesApi.create({ name: data.name });
      const field = await fieldsApi.create({
        name: 'Name',
        type: FieldType.TEXT,
        tableId: table.id,
      });
      await recordsApi.create({
        records: [
          ...Array.from({ length: 1 }, (_) => [
            {
              fieldId: field.id,
              value: '',
            },
          ]),
        ],
        tableId: table.id,
      });
      return table;
    },
    onSuccess: (table) => {
      refetch();
      navigate(
        `/projects/${project.id}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
      );
    },
    onError: (err: Error) => {
      if (
        api.isError(err) &&
        err.response?.status === api.httpStatus.Conflict
      ) {
        toast({
          title: t('Max tables reached'),
          description: t(`You can't create more than {maxTables} tables`, {
            maxTables,
          }),
          variant: 'destructive',
        });
      } else {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  const columns: ColumnDef<RowDataWithActions<Table>, unknown>[] = [
    {
      id: 'select',
      accessorKey: 'select',
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
                .rows.map((row) => row.original);
              setSelectedRows(allRows);
            } else {
              setSelectedRows([]);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRows = [...selectedRows];
              if (isChecked) {
                newSelectedRows.push(row.original);
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
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div
            onAuxClick={(e) => {
              e.stopPropagation();
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="flex justify-center"
          >
            <ApTableActionsMenu
              table={row.original}
              refetch={refetch}
              deleteMutation={bulkDeleteMutation}
            />
          </div>
        );
      },
    },
  ];

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => tablesApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const bulkActions: BulkAction<Table>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmationDeleteDialog
              title={t('Delete Tables')}
              showToast={false}
              message={t(
                'Are you sure you want to delete the selected tables? This action cannot be undone.',
              )}
              entityName={t('table')}
              mutationFn={async () => {
                try {
                  await bulkDeleteMutation.mutateAsync(
                    selectedRows.map((row) => row.id),
                  );
                  resetSelection();
                  setSelectedRows([]);
                } catch (error) {
                  console.error('Error deleting tables:', error);
                }
              }}
            >
              {selectedRows.length > 0 && (
                <Button className="w-full mr-2" size="sm" variant="destructive">
                  <Trash2 className="mr-2 w-4" />
                  {`${t('Delete')} (${selectedRows.length})`}
                </Button>
              )}
            </ConfirmationDeleteDialog>
          </div>
        ),
      },
      {
        render: (_) => (
          <div onClick={(e) => e.stopPropagation()}>
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToPushToGit}
            >
              <PushToGitDialog type="table" tables={selectedRows}>
                {selectedRows.length > 0 && (
                  <Button className="w-full mr-2" size="sm" variant="outline">
                    <UploadCloud className="mr-2 w-4" />
                    {`${t('Push to Git')} (${selectedRows.length})`}
                  </Button>
                )}
              </PushToGitDialog>
            </PermissionNeededTooltip>
          </div>
        ),
      },
    ],
    [bulkDeleteMutation, selectedRows, userHasPermissionToPushToGit],
  );
  if (isCreatingTable) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <div className="flex-col w-full gap-4">
      <div className="flex justify-between items-center">
        <TableTitle
          beta={true}
          description={t(
            'Create and manage your tables to store your automation data',
          )}
        >
          {t('Tables')}
        </TableTitle>
        <PermissionNeededTooltip hasPermission={userHasTableWritePermission}>
          <Button
            size="sm"
            onClick={() => createTable({ name: t('New Table') })}
            className="flex items-center gap-2"
            disabled={!userHasTableWritePermission}
          >
            <Plus className="h-4 w-4" />
            {t('New Table')}
          </Button>
        </PermissionNeededTooltip>
      </div>

      <DataTable
        filters={[
          {
            accessorKey: 'name',
            type: 'input',
            title: t('Name'),
            icon: CheckIcon,
            options: [],
          },
        ]}
        emptyStateIcon={<Table2 className="size-14" />}
        emptyStateTextTitle={t('No tables have been created yet')}
        emptyStateTextDescription={t(
          'Create a table to get started and start managing your automation data',
        )}
        columns={columns}
        page={data}
        isLoading={isLoading}
        onRowClick={(row, newWindow) => {
          const path = `/projects/${project.id}/tables/${row.id}`;
          if (newWindow) {
            openNewWindow(path);
          } else {
            navigate(path);
          }
        }}
        bulkActions={bulkActions}
      />
    </div>
  );
};

ApTablesPage.displayName = 'ApTablesPage';

export { ApTablesPage };
