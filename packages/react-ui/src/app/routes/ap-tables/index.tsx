import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Trash2, Plus, Download, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';


import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useNewWindow } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils, NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import { FieldType, Permission, Table } from '@activepieces/shared';
import RenameTableDialog from '@/features/tables/components/rename-table-dialog';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';

const ApTablesPage = () => {
  const queryClient = useQueryClient();
  
  const openNewWindow = useNewWindow();
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<Array<{ id: string }>>([]);
  const [exportingTableIds, setExportingTableIds] = useState<Set<string>>(
    new Set(),
  );
  const { data: project } = projectHooks.useCurrentProject();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tables', project.id],
    queryFn: () => tablesApi.list(),
  });
  const userHasTableWritePermission = useAuthorization().checkAccess(Permission.WRITE_ALERT)
  const { mutate: createTable, isPending: isCreatingTable } = useMutation({
    mutationFn: async (data: { name: string }) => {
      const table = await tablesApi.create({ name: data.name });
      try {
        await fieldsApi.create({
          name: 'Name',
          type: FieldType.TEXT,
          tableId: table.id,
        });
        await recordsApi.create({
          records: [
            ...Array.from({ length: 10 }, () => [
              {
                key: 'Name',
                value: '',
              },
            ]),
          ],
          tableId: table.id,
        });
      } catch (error) {
        console.error(error);
      }
      return table;
    },
    onSuccess: (table) => {
      refetch();
      navigate(`/projects/${project.id}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`); 
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      return tablesApi.delete(id);
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const handleExportTable = async (id: string, name: string) => {
    try {
      setExportingTableIds((prev) => new Set(prev).add(id));
      await queryClient.fetchQuery({
        queryKey: ['table-export', id],
        queryFn: async () => {
          const data = await tablesApi.export(id);
          const csvRows: string[][] = [];
          // Add header row
          csvRows.push(data.fields.map((f) => f.name));
          // Add data rows
          data.rows.forEach((row) => {
            csvRows.push(data.fields.map((field) => row[field.name] ?? ''));
          });

          // Convert to CSV string
          const csvContent = csvRows
            .map((row) =>
              row
                .map((cell) =>
                  typeof cell === 'string'
                    ? `"${cell.replace(/"/g, '""')}"`
                    : cell,
                )
                .join(','),
            )
            .join('\n');

          // Create and download file
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.style.display = 'none';
          link.href = url;
          link.download = `table-${name}.csv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        },
      });
    } catch (error) {
      console.error(error);
      toast({
        title: t('Error exporting table.'),
        variant: 'destructive',
      });
    } finally {
      setExportingTableIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={exportingTableIds.has(row.original.id)}
              onClick={(e) => {
                e.stopPropagation();
                handleExportTable(row.original.id, row.original.name);
              }}
            >
              {exportingTableIds.has(row.original.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <PermissionNeededTooltip hasPermission={userHasTableWritePermission}>
            <ConfirmationDeleteDialog
              title={t('Delete Table')}
              message={t(
                'Are you sure you want to delete this table? This action cannot be undone.',
              )}
              mutationFn={async () =>
                deleteTableMutation.mutate(row.original.id)
              }
              entityName={t('table')}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                disabled={!userHasTableWritePermission}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </ConfirmationDeleteDialog>
            </PermissionNeededTooltip>
           <PermissionNeededTooltip hasPermission={userHasTableWritePermission}>
           <RenameTableDialog
              tableName={row.original.name}
              tableId={row.original.id}
              onRename={() => refetch()}
            />
           </PermissionNeededTooltip>
            
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
      toast({
        title: t('Error deleting connections'),
        variant: 'destructive',
      });
    },
  });

  const bulkActions: BulkAction<Table>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmationDeleteDialog
              title={t('Delete Tables')}
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
        render: () => (
          <PermissionNeededTooltip hasPermission={userHasTableWritePermission}>
            <Button
            size="sm"
            onClick={() => createTable({ name: t('New Table') })}
            className="flex items-center gap-2"
            loading={isCreatingTable}
            disabled={!userHasTableWritePermission}
          >
            <Plus className="h-4 w-4" />
            {t('New Table')}
          </Button>

          </PermissionNeededTooltip>
          
        ),
      },
    ],
    [bulkDeleteMutation, selectedRows],
  );

  return (
    <div className="flex-col w-full">
      <TableTitle>{t('Tables')}</TableTitle>

      <DataTable
        columns={columns}
        page={data}
        hidePagination={true}
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
