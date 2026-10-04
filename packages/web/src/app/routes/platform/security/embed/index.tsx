import { ApEdition, ApFlagId, SigningKey } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  embedSubdomainQueries,
  signingKeyQueries,
} from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { AllowedWebsitesPanel } from './allowed-websites-panel';
import { EmbedDomainPanel } from './embed-domain-panel';
import { SigningKeysPanel } from './signing-keys-panel';

const EmbedPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;

  const {
    subdomain,
    isLoading: isSubdomainLoading,
    isError: isSubdomainError,
    refetch: refetchSubdomain,
  } = embedSubdomainQueries.useCurrentEmbedSubdomain();
  const {
    data,
    isLoading: isKeysLoading,
    isError: isKeysError,
    refetch,
  } = signingKeyQueries.useSigningKeys();
  const isSample = !platform.plan.embeddingEnabled;
  const signingKeys: SigningKey[] = isSample
    ? sampleData.signingKeys()
    : data?.data ?? [];
  const allowedEmbedOrigins = platform.allowedEmbedOrigins ?? [];

  return (
    <Page width="narrow">
      <PageHeader
        title={t('Embedding')}
        description={t(
          'Put the flow builder inside your own product. Your app signs a token, and the user and project are created on first use.',
        )}
      >
        <Button variant="outline" asChild>
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            {t('Read the docs')}
          </a>
        </Button>
      </PageHeader>

      {isCloud &&
        (isSubdomainLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : isSubdomainError ? (
          <Panel flush>
            <DataFetchErrorState
              entity={t('the embed subdomain')}
              onRetry={refetchSubdomain}
            />
          </Panel>
        ) : (
          <EmbedDomainPanel subdomain={subdomain} />
        ))}

      <AllowedWebsitesPanel allowedEmbedOrigins={allowedEmbedOrigins} />

      <SigningKeysPanel
        signingKeys={signingKeys}
        isLoading={!isSample && isKeysLoading}
        isError={!isSample && isKeysError}
        refetch={refetch}
      />
    </Page>
  );
};

const DOCS_URL = 'https://www.activepieces.com/docs/embedding/overview';

EmbedPage.displayName = 'EmbedPage';
export { EmbedPage };
