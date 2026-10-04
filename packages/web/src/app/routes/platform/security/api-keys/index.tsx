import { ApiKeyResponseWithoutValue } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, KeyRound, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DateCell, NameCell } from '@/components/custom/list/list-cells';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page, PageHeader } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { apiKeyApi, apiKeyQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { API_URL } from '@/lib/api';

import { sampleData } from '../../sample-data';

const ApiKeysPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading, isError, refetch } = apiKeyQueries.useApiKeys();
  const isSample = !platform.plan.apiKeysEnabled;
  const keys: ApiKeyResponseWithoutValue[] = isSample
    ? sampleData.apiKeysPage().data
    : data?.data ?? [];
  const [revoking, setRevoking] = useState<ApiKeyResponseWithoutValue | null>(
    null,
  );
  const newKey = (
    <NewApiKeyDialog onCreate={() => refetch()}>
      <Button>
        <Plus />
        {t('New API key')}
      </Button>
    </NewApiKeyDialog>
  );

  return (
    <Page>
      <PageHeader
        title={t('API keys')}
        description={t(
          'Keys that act as the platform itself, for scripts, CI and your own backend. Each key is shown once.',
        )}
      >
        {newKey}
      </PageHeader>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-gray-11">{t('Base URL')}</span>
        <span className="flex min-w-0 items-center gap-1 rounded-lg border bg-panel py-0.5 pr-0.5 pl-2.5">
          <span className="truncate font-mono text-xs text-gray-12">
            {`${API_URL}/v1`}
          </span>
          <CopyButton
            textToCopy={`${API_URL}/v1`}
            variant="ghost"
            size="icon-sm"
            aria-label={t('Copy base URL')}
          />
        </span>
        <span className="text-gray-11">
          {t('Send the key as a bearer token.')}
        </span>
        <a
          href="https://www.activepieces.com/docs/endpoints/overview"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-accent-11 hover:underline"
        >
          {t('Read the docs')}
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      <DataTable
        emptyStateTextTitle={t('No API keys yet')}
        emptyStateTextDescription={t(
          "Create a key to call the platform's API from a script, a CI pipeline or your own backend.",
        )}
        emptyStateIcon={<KeyRound />}
        emptyStateAction={newKey}
        columns={[
          {
            accessorKey: 'displayName',
            size: 420,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Key')} />
            ),
            cell: ({ row }) => (
              <NameCell
                media={
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-gray-11 [&_svg]:size-3.5">
                    <KeyRound />
                  </span>
                }
                title={row.original.displayName}
                sub={
                  <span className="font-mono">
                    {maskedKey(row.original.truncatedValue)}
                  </span>
                }
              />
            ),
          },
          {
            accessorKey: 'created',
            size: 112,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Created')} />
            ),
            cell: ({ row }) => (
              <DateCell value={row.original.created} mode="short" />
            ),
          },
          {
            accessorKey: 'lastUsedAt',
            size: 148,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Last used')} />
            ),
            cell: ({ row }) => <DateCell value={row.original.lastUsedAt} />,
          },
          {
            id: 'actions',
            size: 56,
            cell: ({ row }) => (
              <div className="flex justify-end">
                <RowMenu
                  items={[
                    {
                      label: t('Revoke'),
                      icon: Trash2,
                      destructive: true,
                      onSelect: () => setRevoking(row.original),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
        page={{ data: keys, next: null, previous: null }}
        hidePagination={true}
        isLoading={!isSample && isLoading}
        isError={!isSample && isError}
        errorStateEntity={t('API keys')}
        onRetry={refetch}
      />
      {revoking && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setRevoking(null);
            }
          }}
          title={t('Revoke {name}?', { name: revoking.displayName })}
          description={t(
            'The key stops working immediately and cannot be restored.',
          )}
          consequence={t(
            'Integrations using this key stop working immediately.',
          )}
          confirmLabel={t('Revoke')}
          typeToConfirm={revoking.displayName}
          onConfirm={async () => {
            await apiKeyApi.delete(revoking.id);
            refetch();
          }}
          onError={() => internalErrorToast()}
        />
      )}
    </Page>
  );
};

function maskedKey(truncatedValue: string): string {
  return `sk-…${truncatedValue.slice(-4)}`;
}

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
