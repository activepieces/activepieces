import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import IssuesTable from '@/features/issues/components/issues-table';
import { platformHooks } from '@/hooks/platform-hooks';

export default function IssuesPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      featureKey="ISSUES"
      cloudOnlyFeature={true}
      locked={!platform.flowIssuesEnabled}
      lockTitle={t('Unlock Flow Issues')}
      lockDescription={t('Track an aggregated issues across your flows')}
    >
      <IssuesTable />
    </LockedFeatureGuard>
  );
}
