import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Pencil, Plus, Trash } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DataTable,
  RowDataWithActions,
  BulkAction,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { FlowTemplate } from '@activepieces/shared';

import { TableTitle } from '../../../../../components/ui/table-title';

import { UpsertTemplateDialog } from './upsert-template-dialog';

export default function TemplatesPage() {
  const { platform } = platformHooks.useCurrentPlatform();

  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['templates', searchParams.toString()],
    staleTime: 0,
    queryFn: () => {
      return templatesApi.list({});
    },
  });

  const [selectedRows, setSelectedRows] = useState<FlowTemplate[]>([]);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => templatesApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
      toast({
        title: t('Success'),
        description: t('Templates deleted successfully'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const columnsWithCheckbox: ColumnDef<RowDataWithActions<FlowTemplate>>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getRowModel().rows.length > 0 &&
            table.getRowModel().rows.every((row) => row.getIsSelected())
          }
          onCheckedChange={(value) => {
            table.toggleAllRowsSelected(!!value);
            const allRows = table.getRowModel().rows.map((row) => row.original);
            setSelectedRows(value ? allRows : []);
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
              let newSelectedRows = [...selectedRows];
              if (value) {
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
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.name}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
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
      accessorKey: 'pieces',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Pieces')} />
      ),
      cell: ({ row }) => {
        return (
          <PieceIconList
            trigger={row.original.template.trigger}
            maxNumberOfIconsToShow={2}
          />
        );
      },
    },
  ];

  const bulkActions: BulkAction<FlowTemplate>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmationDeleteDialog
              title={t('Delete Templates')}
              message={t(
                'Are you sure you want to delete the selected templates?',
              )}
              entityName={t('Templates')}
              mutationFn={async () => {
                await bulkDeleteMutation.mutateAsync(
                  selectedRows.map((row) => row.id),
                );
                resetSelection();
                setSelectedRows([]);
              }}
            >
              {selectedRows.length > 0 && (
                <Button className="w-full mr-2" size="sm" variant="destructive">
                  <Trash className="mr-2 w-4" />
                  {`${t('Delete')} (${selectedRows.length})`}
                </Button>
              )}
            </ConfirmationDeleteDialog>
          </div>
        ),
      },
      {
        render: () => (
          <UpsertTemplateDialog onDone={() => refetch()}>
            <Button
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="size-4" />
              {t('New Template')}
            </Button>
          </UpsertTemplateDialog>
        ),
      },
    ],
    [selectedRows, bulkDeleteMutation],
  );

  const isEnabled = platform.manageTemplatesEnabled;
  return (
    <LockedFeatureGuard
      featureKey="TEMPLATES"
      locked={!isEnabled}
      lockTitle={t('Unlock Templates')}
      lockDescription={t(
        'Convert the most common automations into reusable templates 1 click away from your users',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/templates.mp4"
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between flex-row">
          <TableTitle>{t('Templates')}</TableTitle>
        </div>
        <DataTable
          columns={columnsWithCheckbox}
          page={data}
          hidePagination={true}
          isLoading={isLoading}
          bulkActions={bulkActions}
          actions={[
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <UpsertTemplateDialog
                        onDone={() => refetch()}
                        template={row}
                      >
                        <Button variant="ghost" className="size-8 p-0">
                          <Pencil className="size-4" />
                        </Button>
                      </UpsertTemplateDialog>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Edit template')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            },
          ]}
        />
      </div>
    </LockedFeatureGuard>
  );
}
