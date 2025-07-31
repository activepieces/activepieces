import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Separator } from '@/components/ui/separator';
import { Metrics } from '@/features/platform-admin/components/metrics';
import { RefreshAnalyticsSection } from '@/features/platform-admin/components/refresh-analytics-section';
import { Reports } from '@/features/platform-admin/components/reports';
import { TaskUsage } from '@/features/platform-admin/components/task-usage';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export default function AnalyticsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading } = platformAnalyticsHooks.useAnalytics();
  const isEnabled = platform.plan.analyticsEnabled;
  const showRefreshButton = isEnabled && !isLoading;
  return (
    <LockedFeatureGuard
      featureKey="ANALYTICS"
      locked={!isEnabled}
      lockTitle={t('Unlock Analytics')}
      lockDescription={t(
        'Get insights into your platform usage and performance with our analytics dashboard',
      )}
    >
      <div className="flex flex-col w-full">
        <RefreshAnalyticsSection
          show={showRefreshButton}
          lastRefreshMs={data?.updated ?? ''}
        />
        <div className="mt-8 flex gap-8 flex-col">
          <Metrics report={isLoading ? undefined : data} />
          <Separator />
          <TaskUsage report={isLoading ? undefined : data} />
          <Separator />
          <Separator />
          <Reports report={isLoading ? undefined : data} />
        </div>
      </div>
    </LockedFeatureGuard>
  );
}
