import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  FileText,
  Pencil,
  Plus,
  Trash,
  Tag,
  Clock,
  Puzzle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
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
import { FormattedDate } from '@/components/ui/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { Template, TemplateType } from '@activepieces/shared';

import { CreateTemplateDialog } from './create-template-dialog';
import { UpdateTemplateDialog } from './update-template-dialog';

const PlatformTemplatesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const [searchParams] = useSearchParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['templates', searchParams.toString()],
    staleTime: 0,
    queryFn: () => {
      return templatesApi.list({
        type: TemplateType.CUSTOM,
      });
    },
  });

  const [selectedRows, setSelectedRows] = useState<Template[]>([]);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => templatesApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
      toast.success(t('Templates deleted successfully'), {
        duration: 3000,
      });
    },
  });

  const columnsWithCheckbox: ColumnDef<RowDataWithActions<Template>>[] = [
    {
      id: 'select',
      accessorKey: 'select',
      size: 40,
      minSize: 40,
      maxSize: 40,
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
    },
    {
      accessorKey: 'name',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} icon={Tag} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.name}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Created')}
          icon={Clock}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <FormattedDate date={new Date(row.original.created)} />
          </div>
        );
      },
    },
    {
      accessorKey: 'pieces',
      size: 100,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Pieces')}
          icon={Puzzle}
        />
      ),
      cell: ({ row }) => {
        const trigger = row.original.flows?.[0]?.trigger;
        if (!trigger) return null;
        return <PieceIconList trigger={trigger} maxNumberOfIconsToShow={2} />;
      },
    },
  ];

  const bulkActions: BulkAction<Template>[] = useMemo(
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
    ],
    [selectedRows, bulkDeleteMutation],
  );

  const isEnabled = platform.plan.manageTemplatesEnabled;
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
        <DashboardPageHeader
          description={t(
            'Convert the most common automations into reusable templates',
          )}
          title={t('Templates')}
        >
          <CreateTemplateDialog onDone={() => refetch()}>
            <Button
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="size-4" />
              {t('New Template')}
            </Button>
          </CreateTemplateDialog>
        </DashboardPageHeader>
        <DataTable
          emptyStateTextTitle={t('No templates found')}
          emptyStateTextDescription={t(
            'Create a template for your user to inspire them',
          )}
          emptyStateIcon={<FileText className="size-14" />}
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
                      <UpdateTemplateDialog
                        onDone={() => refetch()}
                        template={row}
                      >
                        <Button variant="ghost" className="size-8 p-0">
                          <Pencil className="size-4" />
                        </Button>
                      </UpdateTemplateDialog>
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
};

export { PlatformTemplatesPage };
