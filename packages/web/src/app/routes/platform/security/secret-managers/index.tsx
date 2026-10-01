import {
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
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

  return (
    <Page width="narrow">
      <PageHeader
        title={t('Secret managers')}
        description={t(
          'Connections read credentials from your vault when a flow runs. Nothing secret is stored here.',
        )}
      >
        <AddEditSecretManagerConnectionDialog>
          <Button>
            <Plus />
            {t('Connect a vault')}
          </Button>
        </AddEditSecretManagerConnectionDialog>
      </PageHeader>

      <PageSection
        title={t('Vaults')}
        description={t(
          'A connection can take any credential field from a vault instead of a pasted value.',
        )}
      >
        {!isSample && isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : !isSample && isError ? (
          <DataFetchErrorState
            entity={t('secret managers')}
            onRetry={refetch}
          />
        ) : vaults.length === 0 ? (
          <Panel>
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
              <EmptyContent>
                <AddEditSecretManagerConnectionDialog>
                  <Button>
                    <Plus />
                    {t('Connect a vault')}
                  </Button>
                </AddEditSecretManagerConnectionDialog>
              </EmptyContent>
            </Empty>
          </Panel>
        ) : (
          <div className="flex flex-col gap-4">
            {vaults.map((vault) => (
              <VaultCard key={vault.id} vault={vault} />
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title={t('How a connection references a secret')}
        description={t('The path format depends on the vault.')}
      >
        <div className="flex flex-col gap-2">
          {SECRET_MANAGER_PROVIDERS_METADATA.map((provider) => (
            <Item key={provider.id} variant="outline">
              <ItemMedia>
                <LogoPlate
                  src={provider.logo}
                  alt={provider.name}
                  size="sm"
                  border
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{provider.name}</ItemTitle>
                <ItemDescription className="font-mono">
                  {referenceExample(provider.secretParams)}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </div>
      </PageSection>
    </Page>
  );
};

export default SecretManagersPage;

const VaultCard = ({ vault }: { vault: SecretManagerConnectionWithStatus }) => {
  const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
    (p) => p.id === vault.providerId,
  );
  const status = resolveStatus(vault);
  const disconnected = status === 'disconnected';
  const { mutate: deleteConnection } =
    secretManagersHooks.useDeleteSecretManagerConnection();
  const { mutate: clearCache, isPending: isClearingCache } =
    secretManagersHooks.useClearCache();

  return (
    <Panel>
      <div className="flex items-start gap-3">
        <LogoPlate
          src={provider?.logo}
          alt={provider?.name ?? vault.name}
          size="md"
          border
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="truncate text-sm font-semibold text-gray-12">
              {vault.name}
            </span>
            <StatusDot tone={STATUS[status].tone}>
              {t(STATUS[status].label)}
            </StatusDot>
          </div>
          <span className="text-xs text-gray-11">
            {[provider?.name, scopeLabel(vault)].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>
      {disconnected && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>
            {t(
              'Connections that read from this vault fail until it reconnects. Enter the new credentials to fix it.',
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <AddEditSecretManagerConnectionDialog connection={vault}>
          <Button variant={disconnected ? 'default' : 'outline'} size="sm">
            <Pencil />
            {disconnected ? t('Enter new credentials') : t('Edit')}
          </Button>
        </AddEditSecretManagerConnectionDialog>
        <Button
          variant="outline"
          size="sm"
          loading={isClearingCache}
          onClick={() => clearCache(vault.id)}
        >
          <RefreshCw />
          {t('Fetch fresh values')}
        </Button>
        <ConfirmDialog
          title={t('Delete {name}?', { name: vault.name })}
          description={t(
            'The platform forgets how to reach this vault. Nothing in the vault itself changes.',
          )}
          consequence={t(
            'Connections that read secrets from it fail on their next run.',
          )}
          onConfirm={async () => deleteConnection(vault.id)}
          confirmLabel={t('Delete')}
        >
          <Button variant="ghost" size="sm">
            <Trash2 />
            {t('Delete')}
          </Button>
        </ConfirmDialog>
      </div>
    </Panel>
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
  { label: string; tone: 'success' | 'danger' | 'neutral' }
> = {
  connected: { label: 'Connected', tone: 'success' },
  disconnected: { label: 'Cannot connect', tone: 'danger' },
  'not-configured': { label: 'Not configured', tone: 'neutral' },
};

type VaultStatus = 'connected' | 'disconnected' | 'not-configured';
