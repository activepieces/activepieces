import {
  ApEdition,
  ApFlagId,
  EmbedSubdomain,
  SigningKey,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  embedSubdomainQueries,
  signingKeyQueries,
} from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { sampleData } from '../../sample-data';

import { AllowedWebsitesPanel } from './allowed-websites-panel';
import { EmbedDomainPanel, useEmbedDomainEditor } from './embed-domain-panel';
import { SigningKeysPanel } from './signing-keys-panel';

const EmbedPage = () => {
  const { subdomain, isLoading, isError, refetch } =
    embedSubdomainQueries.useCurrentEmbedSubdomain();
  return (
    <EmbedPageBody
      key={subdomain?.hostname ?? ''}
      subdomain={subdomain}
      isSubdomainLoading={isLoading}
      isSubdomainError={isError}
      refetchSubdomain={refetch}
    />
  );
};

const EmbedPageBody = ({
  subdomain,
  isSubdomainLoading,
  isSubdomainError,
  refetchSubdomain,
}: EmbedPageBodyProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const editor = useEmbedDomainEditor({ subdomain });

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
    <Page width="narrow" footer={isSample ? undefined : editor.footer}>
      <AdminPageHeader page="embedSdk">
        <Button variant="outline" asChild>
          <a
            {...adminControl(AdminControl.EMBEDDING_DOCS_LINK)}
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
            {t('Read the docs')}
          </a>
        </Button>
      </AdminPageHeader>

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
          <EmbedDomainPanel subdomain={subdomain} editor={editor} />
        ))}

      <AllowedWebsitesPanel allowedEmbedOrigins={allowedEmbedOrigins} />

      <SigningKeysPanel
        signingKeys={signingKeys}
        isLoading={!isSample && isKeysLoading}
        isError={!isSample && isKeysError}
        refetch={refetch}
      />
      {!isSample && editor.dialogs}
    </Page>
  );
};

const DOCS_URL = 'https://www.activepieces.com/docs/embedding/overview';

EmbedPage.displayName = 'EmbedPage';
export { EmbedPage };

type EmbedPageBodyProps = {
  subdomain: EmbedSubdomain | undefined;
  isSubdomainLoading: boolean;
  isSubdomainError: boolean;
  refetchSubdomain: () => Promise<unknown>;
};
