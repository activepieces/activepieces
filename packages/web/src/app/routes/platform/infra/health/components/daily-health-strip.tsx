import { PlatformMetricsHealthDay } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { healthMetricsQueries } from '../lib/health-metrics-hooks';

function isHealthy(day: PlatformMetricsHealthDay): boolean {
  return day.internalErrors === 0 && day.stuckJobs === 0;
}

type DailyHealthStripProps = {
  onSeeRuns: () => void;
};

export function DailyHealthStrip({ onSeeRuns }: DailyHealthStripProps) {
  const { data, isLoading } = healthMetricsQueries.useHealthHistory();
  const days = data?.days ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {t('Daily health')}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {t('Last 30 days')}
            </span>
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onSeeRuns}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('View runs health')}</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex items-end gap-1 h-10">
            {days.map((day) => {
              const healthy = isHealthy(day);
              return (
                <Tooltip key={day.day}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex-1 h-full rounded-sm transition-colors',
                        healthy
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-destructive hover:bg-destructive/80',
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {dayjs(day.day).format('MMM DD, YYYY')}
                    </span>
                    {healthy ? (
                      <span className="text-muted-foreground">
                        {t('Healthy')}
                      </span>
                    ) : (
                      <>
                        <span>
                          {t('{count} internal errors', {
                            count: day.internalErrors,
                          })}
                        </span>
                        <span>
                          {t('{count} affected flows', {
                            count: day.affectedFlows,
                          })}
                        </span>
                        <span>
                          {t('{count} stuck jobs', { count: day.stuckJobs })}
                        </span>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
