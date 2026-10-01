import { ApiKeyResponseWithoutValue } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, KeyRound, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyMedia } from '@/components/ui/empty';
import { internalErrorToast } from '@/components/ui/sonner';
import { apiKeyApi, apiKeyQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { API_URL } from '@/lib/api';

import { listFormat, MutedCell, NameCell } from '../../components/list-cell';
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

  return (
    <Page>
      <PageHeader
        title={t('API keys')}
        description={t(
          'Keys that act as the platform itself, for scripts, CI and your own backend. Each key is shown once.',
        )}
      >
        <NewApiKeyDialog onCreate={() => refetch()}>
          <AnimatedIconButton icon={PlusIcon} iconSize={20}>
            {t('New API key')}
          </AnimatedIconButton>
        </NewApiKeyDialog>
      </PageHeader>
      <PageSection
        title={t('Using the API')}
        action={
          <Button variant="link" asChild>
            <a
              href="https://www.activepieces.com/docs/endpoints/overview"
              target="_blank"
              rel="noreferrer"
            >
              {t('Read the docs')}
              <ExternalLink />
            </a>
          </Button>
        }
      >
        <div className="flex max-w-lg flex-col gap-2">
          <span className="text-sm font-medium text-gray-12">
            {t('Base URL')}
          </span>
          <CopyToClipboardInput useInput={true} textToCopy={`${API_URL}/v1`} />
        </div>
      </PageSection>
      <DataTable
        emptyStateTextTitle={t('No API keys yet')}
        emptyStateTextDescription={t(
          "Create a key to call the platform's API from a script, a CI pipeline or your own backend.",
        )}
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <KeyRound />
          </EmptyMedia>
        }
        columns={[
          {
            accessorKey: 'displayName',
            size: 420,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Key')} />
            ),
            cell: ({ row }) => (
              <NameCell
                title={row.original.displayName}
                sub={
                  <span className="font-mono">{`sk-…${row.original.truncatedValue}`}</span>
                }
              />
            ),
          },
          {
            accessorKey: 'created',
            size: 140,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Created')} />
            ),
            cell: ({ row }) => (
              <MutedCell>{listFormat.shortDate(row.original.created)}</MutedCell>
            ),
          },
          {
            accessorKey: 'lastUsedAt',
            size: 180,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Last used')} />
            ),
            cell: ({ row }) => (
              <MutedCell>
                {listFormat.relativeDate(row.original.lastUsedAt)}
              </MutedCell>
            ),
          },
        ]}
        page={{ data: keys, next: null, previous: null }}
        hidePagination={true}
        isLoading={!isSample && isLoading}
        isError={!isSample && isError}
        errorStateEntity={t('API keys')}
        onRetry={refetch}
        actions={[
          (apiKey) => (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('Key actions')}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRevoking(apiKey)}
                >
                  <Trash2 />
                  {t('Revoke')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        ]}
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

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
