import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Plus, Trash } from 'lucide-react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { NewSigningKeyDialog } from '@/app/routes/platform/security/signing-keys/new-signing-key-dialog';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { signingKeyApi } from '@/features/platform-admin-panel/lib/signing-key-api'; // Update to the correct API endpoint
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { SigningKey } from '@activepieces/ee-shared';

const SigningKeysPage = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['signing-keys'],
    queryFn: () => signingKeyApi.list(),
  });

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
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <TableTitle>{t('Signing Keys')}</TableTitle>
            <div className="text-sm text-muted-foreground">
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
            </div>
          </div>
          <NewSigningKeyDialog onCreate={() => refetch()}>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="size-4" />
              {t('New Signing Key')}
            </Button>
          </NewSigningKeyDialog>
        </div>
        <DataTable
          columns={columns}
          page={data}
          isLoading={isLoading}
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
