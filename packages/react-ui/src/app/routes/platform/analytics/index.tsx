import dayjs from 'dayjs';
import { t } from 'i18next';
import { RefreshCcwIcon } from 'lucide-react';
import { useContext } from 'react';
import { useEffectOnce } from 'react-use';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Metrics } from '@/features/platform-admin/components/metrics';
import { RefreshAnalyticsContext } from '@/features/platform-admin/components/refresh-analytics-provider';
import { Reports } from '@/features/platform-admin/components/reports';
import { TaskUsage } from '@/features/platform-admin/components/task-usage';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

export default function AnalyticsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading } = platformAnalyticsHooks.useAnalytics();
  const isEnabled = platform.plan.analyticsEnabled;
  const showRefreshButton = isEnabled && !isLoading;

  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);

  useEffectOnce(() => {
    const hasAnalyticsExpired = dayjs(data?.updated)
      .add(REPORT_TTL_MS, 'ms')
      .isBefore(dayjs());
    if (hasAnalyticsExpired && !isRefreshing) {
      refreshAnalytics();
    }
  });

  return (
    <LockedFeatureGuard
      featureKey="ANALYTICS"
      locked={!isEnabled}
      lockTitle={t('Unlock Analytics')}
      lockDescription={t(
        'Get insights into your platform usage and performance with our analytics dashboard',
      )}
    >
      <div className="flex flex-col gap-6 w-full">
        <DashboardPageHeader
          title={t('Analytics')}
          description={
            <span>
              {t('Last updated')}:{' '}
              {dayjs(data?.updated).format('MMM DD, hh:mm A')} —{' '}
              {t('Analytics refresh automatically every day')}
            </span>
          }
        >
          {showRefreshButton && (
            <Button
              onClick={() => {
                refreshAnalytics();
              }}
              loading={isRefreshing}
              disabled={isRefreshing}
            >
              <RefreshCcwIcon className="w-4 h-4" />
              {t('Refresh')}
            </Button>
          )}
        </DashboardPageHeader>
        <Metrics report={isLoading ? undefined : data} />
        <Separator />
        <TaskUsage report={isLoading ? undefined : data} />
        <Separator />
        <Separator />
        <Reports report={isLoading ? undefined : data} />
      </div>
    </LockedFeatureGuard>
  );
}
