import { Template, TemplateType } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { FileText, Pencil, Trash, Tag, Clock, Puzzle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  ConfirmDialog,
  adminBulk,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { RowDataWithActions, BulkAction } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIconList } from '@/features/pieces';
import { templatesApi } from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { sampleData } from '../../sample-data';

import { CreateTemplateDialog } from './create-template-dialog';
import { UpdateTemplateDialog } from './update-template-dialog';

const PlatformTemplatesPage = () => {
  const [searchParams] = useSearchParams();
  const { platform } = platformHooks.useCurrentPlatform();
  const isSample = !platform.plan.manageTemplatesEnabled;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates', searchParams.toString()],
    enabled: !isSample,
    staleTime: 0,
    queryFn: () => {
      return templatesApi.list({
        type: TemplateType.CUSTOM,
      });
    },
  });

  const [selectedRows, setSelectedRows] = useState<Template[]>([]);

  const bulkDeleteMutation = useAdminAction<Template[]>({
    verb: 'delete',
    name: (templates) => templatesLabel(templates),
    run: async (templates) => {
      try {
        await adminBulk.runEach({
          items: templates,
          run: (template) => templatesApi.delete(template.id),
          verb: 'delete',
          label: (count) => templatesCountLabel(count),
        });
      } finally {
        await refetch().catch(() => undefined);
      }
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
        render: (
          _selectedRows: RowDataWithActions<Template>[],
          resetSelection: () => void,
        ) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmDialog
              title={t('Delete {name}?', {
                name: templatesLabel(selectedRows),
              })}
              description={t(
                'The selected templates will be permanently deleted.',
              )}
              confirmLabel={t('Delete')}
              controlId={AdminControl.TEMPLATES_DELETE_CONFIRM}
              onConfirm={async () => {
                await bulkDeleteMutation
                  .mutateAsync(selectedRows)
                  .catch((error: unknown) => {
                    if (!adminBulk.isPartialFailure(error)) {
                      throw error;
                    }
                  });
                resetSelection();
                setSelectedRows([]);
              }}
            >
              {selectedRows.length > 0 && (
                <Button
                  {...adminControl(AdminControl.TEMPLATES_DELETE_OPEN)}
                  variant="ghost"
                  size="sm"
                  className="text-danger-11 hover:text-danger-11"
                >
                  <Trash className="mr-1 w-4" />
                  {`${t('Delete')} (${selectedRows.length})`}
                </Button>
              )}
            </ConfirmDialog>
          </div>
        ),
      },
    ],
    [selectedRows, bulkDeleteMutation],
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title={t('Templates')}
        description={t(
          'Convert the most common automations into reusable templates',
        )}
        resources={adminPageResources.templates}
      >
        <CreateTemplateDialog onDone={() => refetch()}>
          <AnimatedIconButton
            {...adminControl(AdminControl.TEMPLATES_NEW_OPEN)}
            icon={PlusIcon}
            iconSize={16}
          >
            {t('New Template')}
          </AnimatedIconButton>
        </CreateTemplateDialog>
      </AdminPageHeader>
      <AdminDataTable
        emptyStateTextTitle={t('No templates found')}
        emptyStateTextDescription={t(
          'Create a template for your user to inspire them',
        )}
        emptyStateIcon={<FileText />}
        columns={columnsWithCheckbox}
        page={isSample ? sampleData.templatesPage() : data}
        hidePagination={true}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('templates')}
        onRetry={refetch}
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
                      <Button
                        {...adminControl(AdminControl.TEMPLATES_EDIT_OPEN)}
                        variant="ghost"
                        size="icon-sm"
                      >
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
    </AdminPage>
  );
};

export { PlatformTemplatesPage };

function templatesLabel(templates: Template[]): string {
  return templates.length === 1
    ? templates[0].name
    : templatesCountLabel(templates.length);
}

function templatesCountLabel(count: number): string {
  return t('{count, plural, =1 {# template} other {# templates}}', { count });
}
