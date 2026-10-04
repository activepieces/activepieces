import {
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { RowMenu } from '@/components/custom/list/row-menu';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { ResourceCard, ResourceGrid } from '@/components/custom/resource-card';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { secretManagersHooks } from '@/features/secret-managers';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import AddEditSecretManagerConnectionDialog from './connect-secret-manager-dialog';

const SecretManagersPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: connections,
    isLoading,
    isError,
    refetch,
  } = secretManagersHooks.useListSecretManagerConnections({
    listForPlatform: true,
  });

  const isSample = !platform.plan.secretManagersEnabled;
  const vaults = (isSample ? sampleData.secretManagers() : connections) ?? [];
  const connectButton = (
    <AddEditSecretManagerConnectionDialog>
      <Button>
        <Plus />
        {t('Connect a vault')}
      </Button>
    </AddEditSecretManagerConnectionDialog>
  );

  return (
    <Page>
      <PageHeader
        title={t('Secret managers')}
        description={t(
          'Connections read credentials from your vault when a flow runs. Nothing secret is stored here.',
        )}
      >
        {connectButton}
      </PageHeader>

      {!isSample && isLoading ? (
        <ResourceGrid>
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </ResourceGrid>
      ) : !isSample && isError ? (
        <Panel flush>
          <DataFetchErrorState
            entity={t('secret managers')}
            onRetry={refetch}
          />
        </Panel>
      ) : vaults.length === 0 ? (
        <Panel flush>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KeyRound />
              </EmptyMedia>
              <EmptyTitle>{t('No vaults connected')}</EmptyTitle>
              <EmptyDescription>
                {t(
                  'Connect one and any connection can read its credentials from a secret path instead of a pasted value.',
                )}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{connectButton}</EmptyContent>
          </Empty>
        </Panel>
      ) : (
        <ResourceGrid>
          {vaults.map((vault) => (
            <VaultCard key={vault.id} vault={vault} />
          ))}
        </ResourceGrid>
      )}

      <PageSection
        title={t('How a connection points to a secret')}
        description={t(
          'In a connection field, pick the vault and enter the path in its format.',
        )}
      >
        <Panel flush>
          <ul className="flex flex-col">
            {SECRET_MANAGER_PROVIDERS_METADATA.map((provider) => (
              <li
                key={provider.id}
                className="flex min-w-0 items-center gap-3 border-t border-gray-6 px-4 py-2.5 first:border-t-0"
              >
                <LogoPlate
                  src={provider.logo}
                  alt={provider.name}
                  size="xs"
                  border
                />
                <span className="w-40 shrink-0 truncate text-sm font-medium text-gray-12">
                  {provider.name}
                </span>
                <code className="min-w-0 truncate font-mono text-xs text-gray-11">
                  {referenceExample(provider.secretParams)}
                </code>
              </li>
            ))}
          </ul>
        </Panel>
      </PageSection>
    </Page>
  );
};

export default SecretManagersPage;

const VaultCard = ({ vault }: { vault: SecretManagerConnectionWithStatus }) => {
  const [deleting, setDeleting] = useState(false);
  const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
    (p) => p.id === vault.providerId,
  );
  const status = resolveStatus(vault);
  const disconnected = status === 'disconnected';
  const { mutate: deleteConnection } =
    secretManagersHooks.useDeleteSecretManagerConnection();
  const { mutate: clearCache } = secretManagersHooks.useClearCache();

  return (
    <>
      <ResourceCard
        media={
          <LogoPlate
            src={provider?.logo}
            alt={provider?.name ?? vault.name}
            size="md"
            border
          />
        }
        title={vault.name}
        status={
          <StatusDot tone={STATUS[status].tone}>
            {STATUS[status].label()}
          </StatusDot>
        }
        meta={[provider?.name, scopeLabel(vault)].filter(Boolean).join(' · ')}
        menu={
          <RowMenu
            items={[
              {
                label: t('Fetch fresh values'),
                icon: RefreshCw,
                onSelect: () => clearCache(vault.id),
              },
              {
                label: t('Delete'),
                icon: Trash2,
                destructive: true,
                onSelect: () => setDeleting(true),
              },
            ]}
          />
        }
        action={
          <AddEditSecretManagerConnectionDialog connection={vault}>
            <Button variant={disconnected ? 'default' : 'outline'} size="sm">
              {disconnected ? t('Enter new credentials') : t('Edit')}
            </Button>
          </AddEditSecretManagerConnectionDialog>
        }
      >
        {disconnected && (
          <p className="text-sm text-danger-11">
            {t(
              'Connections that read from this vault fail until it reconnects.',
            )}
          </p>
        )}
      </ResourceCard>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('Delete {name}?', { name: vault.name })}
        description={t(
          'The platform forgets how to reach this vault. Nothing in the vault itself changes.',
        )}
        consequence={t(
          'Connections that read secrets from it fail on their next run.',
        )}
        typeToConfirm={vault.name}
        onConfirm={async () => deleteConnection(vault.id)}
        confirmLabel={t('Delete')}
      />
    </>
  );
};

function resolveStatus(vault: SecretManagerConnectionWithStatus): VaultStatus {
  if (!vault.connection.configured) return 'not-configured';
  return vault.connection.connected ? 'connected' : 'disconnected';
}

function scopeLabel(vault: SecretManagerConnectionWithStatus): string {
  if (vault.scope === SecretManagerConnectionScope.PLATFORM) {
    return t('Every project');
  }
  return t('{count, plural, =1 {1 project} other {# projects}}', {
    count: vault.projectIds.length,
  });
}

function referenceExample(params: { placeholder: string }[]): string {
  return params
    .map((param) => param.placeholder.replace(/^eg:\s*/i, ''))
    .join(' · ');
}

const STATUS: Record<
  VaultStatus,
  { label: () => string; tone: 'success' | 'danger' | 'neutral' }
> = {
  connected: { label: () => t('Connected'), tone: 'success' },
  disconnected: { label: () => t('Cannot connect'), tone: 'danger' },
  'not-configured': { label: () => t('Not configured'), tone: 'neutral' },
};

type VaultStatus = 'connected' | 'disconnected' | 'not-configured';
