import { t } from 'i18next';
import { Pencil, Plus, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { formatUtils, validationUtils } from '@/lib/utils';

import { proxyConfigApi } from '@/lib/proxy-config-api';
import { UpsertAIProviderDialog } from './upsert-provider-dialog';

export default function AIProvidersPage() {
  const [refreshCount, setRefreshCount] = useState(0);

  const { toast } = useToast();

  const errorToastMessage = (
    provider: string,
    error: unknown,
  ): string | undefined => {
    if (validationUtils.isValidationError(error)) {
      console.error(t('Validation error'), error);
      return t(
        'AI Provider {{provider}} is already configured.',
        { provider },
      );
    }
  };

  const refreshData = () => {
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between flex-row">
        <span className="text-3xl font-bold">{t('AI Providers')}</span>
        <UpsertAIProviderDialog onCreate={() => refreshData()}>
          <Button
            size="sm"
            className="flex items-center justify-center gap-2"
          >
            <Plus className="size-4" />
            {t('New AI Provider')}
          </Button>
        </UpsertAIProviderDialog>
      </div>
      <DataTable
        columns={[
          {
            accessorKey: 'name',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Provider')} />
            ),
            cell: ({ row }) => {
              return (
                <div className="text-left">{row.original.provider}</div>
              );
            },
          },
          {
            accessorKey: 'baseUrl',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Base URL')} />
            ),
            cell: ({ row }) => {
              return (
                <div className="text-left">{row.original.baseUrl}</div>
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
                <div className="text-left">{formatUtils.formatDate(new Date(row.original.created))}</div>
              );
            },
          },
        ]}
        fetchData={() => proxyConfigApi.list()}
        refresh={refreshCount}
        actions={[
          (row) => {
            return (
              <div className="flex items-end justify-end">
                <Tooltip>
                  <TooltipTrigger>
                    <UpsertAIProviderDialog config={row} onCreate={() => refreshData()}>
                      <Button
                        variant="ghost"
                        className="size-8 p-0"
                        onClick={async (e) => {
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </UpsertAIProviderDialog>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t('Edit')} {" "} {row.provider}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          },
          (row) => (
            <div className="flex items-end justify-end">
              <ConfirmationDeleteDialog
                title={`${t('Delete')} ${row.provider}`}
                message={t('Are you sure you want to delete this AI Provider?')}
                entityName={t('AI Provider')}
                mutationFn={async () => {
                  await proxyConfigApi.delete(row.id);
                  refreshData();
                }}
                onError={(error) => {
                  toast({
                    title: t('Error'),
                    description: errorToastMessage(row.provider, error),
                    duration: 3000,
                  });
                }}
              >
                <Button
                  variant="ghost"
                  className="size-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Trash className="size-4 text-destructive" />
                </Button>
              </ConfirmationDeleteDialog>
            </div>
          ),
        ]}
      />
    </div>
  );
}
