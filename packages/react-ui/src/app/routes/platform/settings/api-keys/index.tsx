import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Plus, Trash } from 'lucide-react';
import { useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { NewApiKeyDialog } from '@/app/routes/platform/settings/api-keys/new-api-key-dialog';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  PaginationParams,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { apiKeyApi } from '@/features/platform-admin-panel/lib/api-key-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { ApiKeyResponseWithoutValue } from '@activepieces/ee-shared';

const fetchData = async (
  _params: Record<string, string>,
  _pagination: PaginationParams,
) => {
  return apiKeyApi.list();
};

const ApiKeysPage = () => {
  const [refresh, setRefresh] = useState(0);

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
            <NewApiKeyDialog onCreate={() => setRefresh(refresh + 1)}>
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
          columns={columns}
          refresh={refresh}
          fetchData={fetchData}
          actions={[
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <ConfirmationDeleteDialog
                    title={t('Delete API Key')}
                    message={t('Are you sure you want to delete this API key?')}
                    entityName={t('API Key')}
                    mutationFn={async () => {
                      console.log('HELLO');
                      await apiKeyApi.delete(row.id);
                      setRefresh(refresh + 1);
                    }}
                    onError={(error) => {
                      console.error(error);
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
