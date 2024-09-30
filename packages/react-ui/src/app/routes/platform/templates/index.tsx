import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil, Plus, Trash } from 'lucide-react';
import { useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
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

import { TableTitle } from '../../../../components/ui/table-title';

import { UpsertTemplateDialog } from './upsert-template-dialog';

export default function TemplatesPage() {
  const { platform } = platformHooks.useCurrentPlatform();

  const [refreshCount, setRefreshCount] = useState(0);

  const { toast } = useToast();

  const refreshData = () => {
    setRefreshCount((prev) => prev + 1);
  };

  const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-template'],
    mutationFn: (templateId: string) => templatesApi.delete(templateId),
    onSuccess: () => {
      refreshData();
      toast({
        title: t('Success'),
        description: t('Template deleted successfully'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

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
          <UpsertTemplateDialog onDone={() => refreshData()}>
            <Button
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="size-4" />
              {t('New Template')}
            </Button>
          </UpsertTemplateDialog>
        </div>
        <DataTable
          columns={[
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
          ]}
          fetchData={async () => {
            const response = await templatesApi.list({});
            return { data: response.data, next: null, previous: null };
          }}
          refresh={refreshCount}
          actions={[
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <UpsertTemplateDialog
                        onDone={() => refreshData()}
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
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <ConfirmationDeleteDialog
                        title={t('Delete Template')}
                        message={t(
                          'Are you sure you want to delete this template?',
                        )}
                        entityName={`${t('Template')} ${row.name}`}
                        mutationFn={async () => {
                          deleteTemplate(row.id);
                        }}
                      >
                        <Button
                          disabled={isDeleting}
                          variant="ghost"
                          className="size-8 p-0"
                        >
                          <Trash className="size-4 text-destructive" />
                        </Button>
                      </ConfirmationDeleteDialog>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Delete template')}
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
