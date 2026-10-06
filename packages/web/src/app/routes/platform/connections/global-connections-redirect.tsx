import { AppConnectionScope } from '@activepieces/shared';
import { t } from 'i18next';
import { Navigate, useLocation } from 'react-router-dom';

import { FeatureSample } from '@/app/components/feature-sample';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { PLATFORM_FEATURES } from '@/features/billing';
import { PLATFORM_CONNECTIONS_PARAMS } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../sample-data';

export function GlobalConnectionsRedirect() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { search, hash } = useLocation();
  if (!platform.plan.globalConnectionsEnabled) {
    return <GlobalConnectionsTeaser />;
  }
  const params = new URLSearchParams(search);
  params.set(PLATFORM_CONNECTIONS_PARAMS.scope, AppConnectionScope.PLATFORM);
  return (
    <Navigate
      to={{
        pathname: '/platform/connections',
        search: `?${params.toString()}`,
        hash,
      }}
      replace
    />
  );
}

function GlobalConnectionsTeaser() {
  const feature = PLATFORM_FEATURES.globalConnections;
  return (
    <FeatureSample
      locked
      title={feature.title}
      description={feature.description}
      tier={feature.tier}
      featureKey={feature.featureKey}
    >
      <Page>
        <PageHeader
          title={t('Global connections')}
          description={t(
            'Connections shared with the projects you choose, managed in one place.',
          )}
        />
        <Panel flush>
          <SettingRows>
            {sampleData.globalConnectionsPage().data.map((connection) => (
              <SettingRow
                key={connection.id}
                title={connection.displayName}
                description={t('Shared with every project')}
              >
                <StatusDot tone="success">{t('Connected')}</StatusDot>
              </SettingRow>
            ))}
          </SettingRows>
        </Panel>
      </Page>
    </FeatureSample>
  );
}
