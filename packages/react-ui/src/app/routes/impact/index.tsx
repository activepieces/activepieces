import { AnalyticsTimePeriod } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  Calendar,
  Info,
  LineChart,
  List,
  RefreshCcw,
} from 'lucide-react';
import { useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';

import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { projectCollectionUtils } from '@/hooks/project-collection';

import { ProjectSelect } from './components/project-select';
import { FlowsDetails } from './details';
import { Summary } from './summary';
import { Trends } from './trends';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

type TabValue = 'analytics' | 'details';

export default function ImpactPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('projectId') || undefined;
  const selectedTimePeriod =
    (searchParams.get('timePeriod') as AnalyticsTimePeriod) ||
    AnalyticsTimePeriod.LAST_MONTH;
  const activeTab = (searchParams.get('tab') as TabValue) || 'analytics';

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
    newParams.set('timePeriod', timePeriod);
    setSearchParams(newParams, { replace: true });
  };

  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'analytics') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
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

  const report = isLoading ? undefined : data ?? undefined;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <ApSidebarToggle />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-medium">{t('Impact')}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                {t('View impact analytics and metrics')}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-md text-sm text-muted-foreground">
            <span>
              {t('Updated')} {dayjs(data?.updated).format('MMM DD, hh:mm A')} —{' '}
              {t('Refreshes daily')}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => refreshAnalytics()}
                  disabled={isRefreshing}
                >
                  <RefreshCcw
                    className={`h-3.5 w-3.5 ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Refresh analytics')}</TooltipContent>
            </Tooltip>
          </div>

          <Select
            value={selectedTimePeriod}
            onValueChange={handleTimePeriodChange}
          >
            <SelectTrigger className="w-auto gap-2">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" align="end">
              <SelectItem value={AnalyticsTimePeriod.LAST_WEEK}>
                {t('Last 7 days')}
              </SelectItem>
              <SelectItem value={AnalyticsTimePeriod.LAST_MONTH}>
                {t('Last 30 days')}
              </SelectItem>
              <SelectItem value={AnalyticsTimePeriod.LAST_THREE_MONTHS}>
                {t('Last 3 months')}
              </SelectItem>
              <SelectItem value={AnalyticsTimePeriod.LAST_SIX_MONTHS}>
                {t('Last 6 months')}
              </SelectItem>
              <SelectItem value={AnalyticsTimePeriod.LAST_YEAR}>
                {t('Last year')}
              </SelectItem>
            </SelectContent>
          </Select>

          <ProjectSelect
            projects={projects ?? []}
            selectedProjectId={selectedProjectId}
            onProjectChange={handleProjectChange}
          />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList variant="outline" className="border-b w-full">
          <TabsTrigger variant="outline" value="analytics">
            <LineChart className="w-4 h-4 mr-2" />
            {t('Analytics')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="details">
            <List className="w-4 h-4 mr-2" />
            {t('Details')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="flex flex-col gap-6">
            <Summary report={report ?? undefined} />
            <Trends report={report ?? undefined} />
          </div>
        </TabsContent>

        <TabsContent value="details">
          <FlowsDetails
            report={report}
            isLoading={isLoading}
            projects={projects}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
