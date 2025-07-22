import dayjs from 'dayjs';
import { t } from 'i18next';
import { RefreshCcwIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { platformAnalyticsHooks } from './analytics-hooks';

export const RefreshAnalyticsSection = ({
  lastRefreshMs,
}: {
  lastRefreshMs: string;
}) => {
  const { mutate: refreshAnalytics, isPending } =
    platformAnalyticsHooks.useRefreshAnalytics();
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
            onClick={() => refreshAnalytics()}
            loading={isPending}
          >
            <RefreshCcwIcon className="w-4 h-4" />
            {t('Refresh')}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t(
            'Your reports are automatically updated daily, refresh to get the latest data',
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
