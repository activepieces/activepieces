import { ApiKeyResponseWithoutValue } from '@activepieces/shared';
import {
  Add01Icon,
  Delete02Icon,
  Key01Icon,
  LinkSquare02Icon,
} from '@hugeicons/core-free-icons';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { DateCell, NameCell } from '@/components/custom/list/list-cells';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { apiKeyMutations, apiKeyQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
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
  const [creating, setCreating] = useState(false);
  const { mutateAsync: revokeKey } = apiKeyMutations.useDeleteApiKey();
  const columns = useMemo(() => apiKeyColumns({ onRevoke: setRevoking }), []);
  const newKey = (
    <Button
      {...adminControl(AdminControl.API_KEYS_API_KEY_OPEN)}
      onClick={() => setCreating(true)}
    >
      <HugeiconsIcon icon={Add01Icon} />
      {t('New API key')}
    </Button>
  );

  return (
    <Page>
      <AdminPageHeader page="apiKeys">{newKey}</AdminPageHeader>
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
          <HugeiconsIcon icon={LinkSquare02Icon} className="size-3.5" />
        </a>
      </div>
      <DataTable
        emptyStateTextTitle={t('No API keys yet')}
        emptyStateTextDescription={t(
          "Create a key to call the platform's API from a script, a CI pipeline or your own backend.",
        )}
        emptyStateIcon={<HugeiconsIcon icon={Key01Icon} />}
        emptyStateAction={newKey}
        columns={columns}
        page={{ data: keys, next: null, previous: null }}
        hidePagination={true}
        isLoading={!isSample && isLoading}
        isError={!isSample && isError}
        errorStateEntity={t('API keys')}
        onRetry={refetch}
      />
      <NewApiKeyDialog
        open={creating}
        onOpenChange={setCreating}
        onCreate={refetch}
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
          onConfirm={() => revokeKey(revoking.id)}
          successMessage={t('{name} revoked', { name: revoking.displayName })}
          controlId={AdminControl.API_KEYS_API_KEY_REVOKE_CONFIRM}
        />
      )}
    </Page>
  );
};

function apiKeyColumns({
  onRevoke,
}: {
  onRevoke: (key: ApiKeyResponseWithoutValue) => void;
}): ColumnDef<RowDataWithActions<ApiKeyResponseWithoutValue>>[] {
  return [
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
              <HugeiconsIcon icon={Key01Icon} />
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
      cell: ({ row }) => <DateCell value={row.original.created} mode="short" />,
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
                icon: Delete02Icon,
                destructive: true,
                control: AdminControl.API_KEYS_API_KEY_REVOKE_OPEN,
                onSelect: () => onRevoke(row.original),
              },
            ]}
          />
        </div>
      ),
    },
  ];
}

function maskedKey(truncatedValue: string): string {
  return `sk-…${truncatedValue.slice(-4)}`;
}

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
