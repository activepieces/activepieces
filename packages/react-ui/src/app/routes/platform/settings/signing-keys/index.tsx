import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { NewSigningKeyDialog } from '@/app/routes/platform/settings/signing-keys/new-signing-key-dialog';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  PaginationParams,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { signingKeyApi } from '@/features/platform-admin-panel/lib/signing-key-api'; // Update to the correct API endpoint
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { SigningKey } from '@activepieces/ee-shared';

const fetchData = async (
  _params: Record<string, string>,
  _pagination: PaginationParams,
) => {
  return signingKeyApi.list();
};

const SigningKeysPage = () => {
  const [refresh, setRefresh] = useState(0);

  const columns: ColumnDef<RowDataWithActions<SigningKey>>[] = [
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
      featureKey="SIGNING_KEYS"
      locked={!platform.embeddingEnabled}
      lockTitle={t('Unlock Embedding Through JS SDK')}
      lockDescription={t(
        'Enable signing keys to access embedding functionalities.',
      )}
    >
      <div className="flex-col w-full">
        <div className="mb-4 flex">
          <div className="flex justify-between flex-row w-full">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold w-full">{t('Signing Keys')}</h1>
              <div className="text-sm text-muted-foreground  flex-col gap-2 ">
                <Trans>
                  Use our embedding{' '}
                  <Link
                    rel="noopener noreferrer"
                    target="_blank"
                    className="font-medium text-primary underline underline-offset-4"
                    to="https://www.activepieces.com/docs/embedding/provision-users"
                  >
                    JavaScript SDK
                  </Link>{' '}
                  to authenticate users with signing keys.
                </Trans>

                <div></div>
              </div>
            </div>
            <NewSigningKeyDialog onCreate={() => setRefresh(refresh + 1)}>
              <Button
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <Plus className="size-4" />
                {t('New Signing Key')}
              </Button>
            </NewSigningKeyDialog>
          </div>
        </div>
        <DataTable
          columns={columns}
          refresh={refresh}
          fetchData={fetchData}
          actions={[
            (row) => (
              <div className="flex items-end justify-end">
                <ConfirmationDeleteDialog
                  title={t('Delete Signing Key')}
                  message={t(
                    'Are you sure you want to delete this signing key?',
                  )}
                  entityName={t('Signing Key')}
                  mutationFn={async () => {
                    await signingKeyApi.delete(row.id);
                    setRefresh(refresh + 1);
                  }}
                  onError={(error) => {
                    console.error(error);
                    toast(INTERNAL_ERROR_TOAST);
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
    </LockedFeatureGuard>
  );
};

SigningKeysPage.displayName = 'SigningKeysPage';
export { SigningKeysPage };
