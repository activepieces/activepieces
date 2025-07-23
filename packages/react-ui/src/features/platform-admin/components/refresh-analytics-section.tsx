import dayjs from 'dayjs';
import { t } from 'i18next';
import { RefreshCcwIcon } from 'lucide-react';
import { useContext, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { platformAnalyticsHooks } from '../lib/analytics-hooks';

import { RefreshAnalyticsContext } from './refresh-analytics-provider';
const REPORT_TTL_MS = 1000 * 60 * 60 * 24;
export const RefreshAnalyticsSection = ({
  lastRefreshMs,
}: {
  lastRefreshMs: string;
}) => {
  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);
  useEffect(() => {
    const hasAnalyticsExpired = dayjs(lastRefreshMs)
      .add(REPORT_TTL_MS, 'ms')
      .isBefore(dayjs());
    if (hasAnalyticsExpired && !isRefreshing) {
      refreshAnalytics();
    }
  }, []);
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-md">
        <span className="font-semibold">{t('Last refresh')}:</span>{' '}
        {dayjs(lastRefreshMs).format('MMM DD, hh:mm a')}
      </div>
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant={'outline'}
            onClick={() => {
              refreshAnalytics();
            }}
            loading={isRefreshing}
          >
            <RefreshCcwIcon className="w-4 h-4" />
            {t('Refresh')}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!isRefreshing &&
            t(
              'Your analytics are automatically updated daily, refresh to get the latest data',
            )}
          {isRefreshing &&
            t('Your analytics are being updated, please wait a moment')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
