import dayjs from 'dayjs';
import { t } from 'i18next';
import { CalendarDays, RefreshCcwIcon } from 'lucide-react';
import { useContext } from 'react';
import { useEffectOnce } from 'react-use';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { userHooks } from '@/hooks/user-hooks';
import {
  DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP,
  isNil,
  PlatformRole,
} from '@activepieces/shared';

import { FlowsDetails } from './details';
import { EditEstimatedTimeSavedPerStepPopover } from './edit-estimated-time-saved-per-step-popover';
import { Summary } from './summary';
import { Trends } from './trends';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

export default function AnalyticsPage() {
  const { data: user } = userHooks.useCurrentUser();
  const { data, isLoading } = platformAnalyticsHooks.useAnalytics();
  const showRefreshButton = !isLoading;
  const isPlatformAdmin = user?.platformRole === PlatformRole.ADMIN;

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
    <div className="flex flex-col gap-2 w-full">
      <DashboardPageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{t('Analytics')}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/80 text-accent-foreground text-xs font-medium border border-border/50 cursor-help">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {t('Past 3 months')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t('Showing insights from the last 90 days')}
              </TooltipContent>
            </Tooltip>
          </div>
        }
        description={
          <span className="text-muted-foreground">
            {t('Updated')} {dayjs(data?.updated).format('MMM DD, hh:mm A')} —{' '}
            {t('Refreshes daily')}
          </span>
        }
      >
        <div className="flex items-center gap-2">
          {isPlatformAdmin && !isLoading && (
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
  );
}
