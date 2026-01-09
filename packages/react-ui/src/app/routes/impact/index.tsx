import dayjs from 'dayjs';
import { t } from 'i18next';
import { Calendar, CalendarDays, Folder, RefreshCcwIcon } from 'lucide-react';
import { useContext, useMemo } from 'react';
import { useEffectOnce } from 'react-use';
import { useSearchParams } from 'react-router-dom';

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
import { platformAnalyticsHooks, TimePeriod } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { userHooks } from '@/hooks/user-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import {
  PlatformRole,
} from '@activepieces/shared';

import { FlowsDetails } from './details';
import { Summary } from './summary';
import { TimeSavedEncouragementBanner } from './time-saved-encouragement-banner';
import { Trends } from './trends';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

export default function AnalyticsPage() {
  const { data: user } = userHooks.useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('projectId') || undefined;
  const selectedTimePeriod = (searchParams.get('timePeriod') as TimePeriod) || TimePeriod.LAST_MONTH;
  const { data: projects } = projectCollectionUtils.useAll();
  const { data, isLoading } = platformAnalyticsHooks.useAnalyticsTimeBased(
    selectedTimePeriod,
    selectedProjectId,
  );
  const showRefreshButton = !isLoading;
  const isPlatformAdmin = user?.platformRole === PlatformRole.ADMIN;

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
    if (timePeriod === TimePeriod.LAST_MONTH) {
      newParams.delete('timePeriod');
    } else {
      newParams.set('timePeriod', timePeriod);
    }
    setSearchParams(newParams, { replace: true });
  };

  const timePeriodLabel = useMemo(() => {
    switch (selectedTimePeriod) {
      case TimePeriod.LAST_WEEK:
        return t('Last 7 days');
      case TimePeriod.LAST_MONTH:
        return t('Last 30 days');
      case TimePeriod.ALL_TIME:
        return t('All Time');
      default:
        return t('Last 30 days');
    }
  }, [selectedTimePeriod]);

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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/80 text-accent-foreground text-xs font-medium border border-border/50 cursor-help">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {timePeriodLabel}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t('Showing insights for the selected time period')}
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
          <Select
            value={selectedTimePeriod}
            onValueChange={handleTimePeriodChange}
          >
            <SelectTrigger>
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TimePeriod.LAST_WEEK}>{t('Last 7 days')}</SelectItem>
              <SelectItem value={TimePeriod.LAST_MONTH}>{t('Last 30 days')}</SelectItem>
              <SelectItem value={TimePeriod.ALL_TIME}>{t('All Time')}</SelectItem>
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
          {showRefreshButton && (
            <Button
              onClick={() => {
                refreshAnalytics();
              }}
              loading={isRefreshing}
              disabled={isRefreshing}
            >
              <RefreshCcwIcon className="w-4 h-4 mr-2" />
              {t('Refresh')}
            </Button>
          )}
        </div>
      </DashboardPageHeader>
      <Summary report={isLoading ? undefined : data ?? undefined} />
      <TimeSavedEncouragementBanner report={isLoading ? undefined : data ?? undefined} />
      <Trends report={isLoading ? undefined : data ?? undefined} />
      <FlowsDetails
        report={isLoading ? undefined : data ?? undefined}
        isLoading={isLoading}
      />
    </div>
  );
}
