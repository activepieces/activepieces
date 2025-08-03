import dayjs from 'dayjs';
import { t } from 'i18next';
import { RefreshCcwIcon } from 'lucide-react';
import { useContext } from 'react';
import { useEffectOnce } from 'react-use';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { platformAnalyticsHooks } from '../lib/analytics-hooks';

import { RefreshAnalyticsContext } from './refresh-analytics-provider';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

type RefreshAnalyticsSectionProps = {
  lastRefreshMs: string;
  show?: boolean;
};

export const RefreshAnalyticsSection = ({
  lastRefreshMs,
  show = true,
}: RefreshAnalyticsSectionProps) => {
  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);

  useEffectOnce(() => {
    const hasAnalyticsExpired = dayjs(lastRefreshMs)
      .add(REPORT_TTL_MS, 'ms')
      .isBefore(dayjs());
    if (hasAnalyticsExpired && !isRefreshing) {
      refreshAnalytics();
    }
  });

  return (
    <div
      className={cn(
        'flex items-center gap-2 min-h-[40px] transition-opacity',
        show
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none',
      )}
      aria-hidden={!show}
    >
      <div className={cn('text-md flex items-center gap-2 w-full')}>
        <span className="font-semibold">{t('Last refresh')}:</span>{' '}
        {dayjs(lastRefreshMs).format('MMM DD, hh:mm a')}
        <Tooltip>
          <TooltipTrigger>
            <span>
              <Button
                variant={'ghost'}
                onClick={() => {
                  refreshAnalytics();
                }}
                loading={isRefreshing}
                disabled={isRefreshing}
              >
                <RefreshCcwIcon className="w-4 h-4" />
              </Button>
            </span>
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
    </div>
  );
};
