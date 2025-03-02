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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TableTitle } from '@/components/ui/table-title';
import { toast } from '@/components/ui/use-toast';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { formatUtils } from '@/lib/utils';
import { Table } from '@activepieces/shared';
import { projectHooks } from '@/hooks/project-hooks';

const TablesPage= () => {
  const queryClient = useQueryClient();
  const openNewWindow = useNewWindow();
  const navigate = useNavigate();
  const [showNewTableDialog, setShowNewTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedRows, setSelectedRows] = useState<Array<{ id: string }>>([]);
  const [exportingTableIds, setExportingTableIds] = useState<Set<string>>(
    new Set(),
  );
  const { data:project } = projectHooks.useCurrentProject();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tables', project.id],
    queryFn: () => tablesApi.list(),
  });

  const createTableMutation = useMutation({
    mutationFn: async () => {
      return tablesApi.create({ name: newTableName });
    },
    onSuccess: () => {
      setNewTableName('');
      setShowNewTableDialog(false);
      refetch();
      toast({
        title: t('Success'),
        description: t('Table has been created'),
        duration: 3000,
      });
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
      toast({
        title: t('Error deleting table.'),
        variant: 'destructive',
      });
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

  const handleCreateTable = () => {
    createTableMutation.mutate();
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
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </ConfirmationDeleteDialog>
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
          <Button
            size="sm"
            onClick={() => setShowNewTableDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('New Table')}
          </Button>
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

      <Dialog open={showNewTableDialog} onOpenChange={setShowNewTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New Table')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('Table name')}
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTable();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewTableDialog(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={!newTableName.trim() || createTableMutation.isPending}
            >
              {createTableMutation.isPending ? t('Creating...') : t('Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { TablesPage };
