import dayjs from 'dayjs';
import { t } from 'i18next';
import { RefreshCcwIcon } from 'lucide-react';
import { useContext } from 'react';
import { useEffectOnce } from 'react-use';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP,
  isNil,
} from '@activepieces/shared';

import { FlowsDetails } from './details';
import { EditEstimatedTimeSavedPerStepPopover } from './edit-estimated-time-saved-per-step-popover';
import { Summary } from './summary';
import { Trends } from './trends';

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

  const resolvedEstimatedTimeSavedPerStep = isNil(
    data?.estimatedTimeSavedPerStep,
  )
    ? DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP
    : data?.estimatedTimeSavedPerStep;

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
          <div className="flex items-center gap-2">
            {isEnabled && !isLoading && (
              <EditEstimatedTimeSavedPerStepPopover
                currentValue={data?.estimatedTimeSavedPerStep}
              >
                <Button variant="outline">
                  {t('Estimation')}: {resolvedEstimatedTimeSavedPerStep}{' '}
                  {t('min/step')}
                </Button>
              </EditEstimatedTimeSavedPerStepPopover>
            )}
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
          </div>
        </DashboardPageHeader>
        <Summary report={isLoading ? undefined : data} />
        <Trends report={isLoading ? undefined : data} />
        <FlowsDetails
          flowsDetails={isLoading ? undefined : data?.flowsDetails}
          estimatedTimeSavedPerStep={data?.estimatedTimeSavedPerStep}
          isLoading={isLoading}
        />
      </div>
    </LockedFeatureGuard>
  );
}
