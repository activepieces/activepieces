import {
  ApEdition,
  ApFlagId,
  EmbedSubdomainStatus,
  SigningKey,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
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

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {isCloud && subdomain && (
          <a href="#embed-domain" className="hover:underline">
            <StatusDot tone={DOMAIN_TONE[subdomain.status]}>
              {t('Domain · {hostname}', { hostname: subdomain.hostname })}
            </StatusDot>
          </a>
        )}
        <a href="#embed-websites" className="hover:underline">
          <StatusDot
            tone={allowedEmbedOrigins.length > 0 ? 'success' : 'neutral'}
          >
            {t('Allowed websites · {count}', {
              count: allowedEmbedOrigins.length,
            })}
          </StatusDot>
        </a>
        <a href="#embed-keys" className="hover:underline">
          <StatusDot tone={signingKeys.length > 0 ? 'success' : 'neutral'}>
            {t('Signing keys · {count}', { count: signingKeys.length })}
          </StatusDot>
        </a>
      </div>

      {isCloud && (
        <div id="embed-domain" className="scroll-mt-6">
          {isSubdomainLoading ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : isSubdomainError ? (
            <DataFetchErrorState
              entity={t('the embed subdomain')}
              onRetry={refetchSubdomain}
            />
          ) : (
            <EmbedDomainPanel subdomain={subdomain} />
          )}
        </div>
      )}

      <div id="embed-websites" className="scroll-mt-6">
        <AllowedWebsitesPanel allowedEmbedOrigins={allowedEmbedOrigins} />
      </div>

      <div id="embed-keys" className="scroll-mt-6">
        <SigningKeysPanel
          signingKeys={signingKeys}
          isLoading={!isSample && isKeysLoading}
          isError={!isSample && isKeysError}
          refetch={refetch}
        />
      </div>

      <PageSection title={t('Next steps')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map((step) => (
            <Item key={step.title} variant="outline" asChild>
              <a href={step.href} target="_blank" rel="noopener noreferrer">
                <ItemContent>
                  <ItemTitle>{t(step.title)}</ItemTitle>
                  <ItemDescription>{t(step.hint)}</ItemDescription>
                </ItemContent>
                <ItemActions className="self-start text-gray-11">
                  <ExternalLink className="size-4" />
                </ItemActions>
              </a>
            </Item>
          ))}
        </div>
      </PageSection>
    </Page>
  );
};

const DOCS_URL = 'https://www.activepieces.com/docs/embedding/overview';

const DOMAIN_TONE: Record<
  EmbedSubdomainStatus,
  'success' | 'warning' | 'danger'
> = {
  [EmbedSubdomainStatus.ACTIVE]: 'success',
  [EmbedSubdomainStatus.PENDING_VERIFICATION]: 'warning',
  [EmbedSubdomainStatus.FAILED]: 'danger',
};

const NEXT_STEPS = [
  {
    title: 'Embed SDK guide',
    hint: 'Drop the builder into a page with the JS SDK.',
    href: 'https://www.activepieces.com/docs/embedding/embed-builder',
  },
  {
    title: 'Provision users',
    hint: 'Create the user and project on first use.',
    href: 'https://www.activepieces.com/docs/embedding/provision-users',
  },
  {
    title: 'Customise pieces',
    hint: 'Choose which pieces your embedded builder offers.',
    href: 'https://www.activepieces.com/docs/embedding/customize-pieces',
  },
];

EmbedPage.displayName = 'EmbedPage';
export { EmbedPage };
