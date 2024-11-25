import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Plus, Trash } from 'lucide-react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { apiKeyApi } from '@/features/platform-admin-panel/lib/api-key-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { ApiKeyResponseWithoutValue } from '@activepieces/ee-shared';

const ApiKeysPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['api-keys'],
    gcTime: 0,
    staleTime: 0,
    queryFn: () => apiKeyApi.list(),
  });

  const columns: ColumnDef<RowDataWithActions<ApiKeyResponseWithoutValue>>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Id')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.id}</div>;
      },
    },
    {
      accessorKey: 'displayName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Display Name')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.displayName}</div>;
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
  ];

  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      featureKey="API"
      locked={!platform.apiKeysEnabled}
      lockTitle={t('Enable API Keys')}
      lockDescription={t(
        'Create and manage API keys to access Activepieces APIs.',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/api-keys.mp4"
    >
      <div className="flex-col w-full">
        <div className="mb-4 flex">
          <div className="flex items-center justify-between flex-row w-full">
            <span className="text-2xl font-bold w-full">{t('API Keys')}</span>
            <NewApiKeyDialog
              onCreate={() =>
                queryClient.invalidateQueries({ queryKey: ['api-keys'] })
              }
            >
              <Button
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <Plus className="size-4" />
                {t('New Api Key')}
              </Button>
            </NewApiKeyDialog>
          </div>
        </div>
        <DataTable
          page={data}
          isLoading={isLoading}
          columns={columns}
          actions={[
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <ConfirmationDeleteDialog
                    title={t('Delete API Key')}
                    message={t('Are you sure you want to delete this API key?')}
                    entityName={t('API Key')}
                    mutationFn={async () => {
                      await apiKeyApi.delete(row.id);
                      refetch();
                    }}
                    onError={() => {
                      toast(INTERNAL_ERROR_TOAST);
                    }}
                  >
                    <Button variant="ghost" className="size-8 p-0">
                      <Trash className="size-4 text-destructive" />
                    </Button>
                  </ConfirmationDeleteDialog>
                </div>
              );
            },
          ]}
        />
      </div>
    </LockedFeatureGuard>
  );
};

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
