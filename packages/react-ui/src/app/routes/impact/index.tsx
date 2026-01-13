import dayjs from 'dayjs';
import { t } from 'i18next';
import { Calendar, Folder, RefreshCcwIcon } from 'lucide-react';
import { useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { AnalyticsTimePeriod } from '@activepieces/shared';

import { FlowsDetails } from './details';
import { Summary } from './summary';
import { TimeSavedEncouragementBanner } from './time-saved-encouragement-banner';
import { Trends } from './trends';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('projectId') || undefined;
  const selectedTimePeriod =
    (searchParams.get('timePeriod') as AnalyticsTimePeriod) ||
    AnalyticsTimePeriod.ALL_TIME;
  const { data: projects } = projectCollectionUtils.useAll();
  const { data, isLoading } = platformAnalyticsHooks.useAnalyticsTimeBased(
    selectedTimePeriod,
    selectedProjectId,
  );

  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);

  const handleProjectChange = (projectId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (projectId === 'all') {
      newParams.delete('projectId');
    } else {
      newParams.set('projectId', projectId);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleTimePeriodChange = (timePeriod: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (timePeriod === AnalyticsTimePeriod.ALL_TIME) {
      newParams.delete('timePeriod');
    } else {
      newParams.set('timePeriod', timePeriod);
    }
    setSearchParams(newParams, { replace: true });
  };

  useEffectOnce(() => {
    const hasAnalyticsExpired = dayjs(data?.updated)
      .add(REPORT_TTL_MS, 'ms')
      .isBefore(dayjs());
    if (hasAnalyticsExpired && !isRefreshing) {
      refreshAnalytics();
    }
  });

  return (
    <div className="flex flex-col gap-2 w-full">
      <DashboardPageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{t('Analytics')}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => refreshAnalytics()}
                  disabled={isRefreshing}
                >
                  <RefreshCcwIcon
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Refresh analytics')}</TooltipContent>
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
          <Select
            value={selectedTimePeriod}
            onValueChange={handleTimePeriodChange}
          >
            <SelectTrigger>
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AnalyticsTimePeriod.LAST_WEEK}>
                {t('Last 7 days')}
              </SelectItem>
              <SelectItem value={AnalyticsTimePeriod.LAST_MONTH}>
                {t('Last 30 days')}
              </SelectItem>
              <SelectItem value={AnalyticsTimePeriod.ALL_TIME}>
                {t('All Time')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedProjectId || 'all'}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger>
              <Folder className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('All Projects')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Projects')}</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DashboardPageHeader>
      <Summary report={isLoading ? undefined : data ?? undefined} />
      <TimeSavedEncouragementBanner
        report={isLoading ? undefined : data ?? undefined}
      />
      <Trends report={isLoading ? undefined : data ?? undefined} />
      <FlowsDetails
        report={isLoading ? undefined : data ?? undefined}
        isLoading={isLoading}
      />
    </div>
  );
}
