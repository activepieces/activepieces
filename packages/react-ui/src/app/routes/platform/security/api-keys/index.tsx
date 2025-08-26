import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Key, Plus, Trash } from 'lucide-react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { apiKeyApi } from '@/features/platform-admin/lib/api-key-api';
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
      locked={!platform.plan.apiKeysEnabled}
      lockTitle={t('Enable API Keys')}
      lockDescription={t(
        'Create and manage API keys to access Activepieces APIs.',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/api-keys.mp4"
    >
      <div className="flex-col w-full">
        <DashboardPageHeader
          title={t('API Keys')}
          description={t('Mange API keys')}
        >
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
        </DashboardPageHeader>
        <DataTable
          emptyStateTextTitle={t('No API keys found')}
          emptyStateTextDescription={t(
            'Start by creating an API key to communicate with Activepieces APIs',
          )}
          emptyStateIcon={<Key className="size-14" />}
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
