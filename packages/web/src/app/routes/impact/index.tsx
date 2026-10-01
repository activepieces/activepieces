import { AnalyticsTimePeriod } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Calendar, LineChart, List, RefreshCcw } from 'lucide-react';
import { useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { toast } from 'sonner';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { Page, PageHeader } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  platformAnalyticsHooks,
  RefreshAnalyticsContext,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { ProjectSelect } from './components/project-select';
import { FlowsDetails } from './details';
import { Summary } from './summary';
import { Trends } from './trends';

const REPORT_TTL_MS = 1000 * 60 * 60 * 24;

type TabValue = 'analytics' | 'details';

export default function ImpactPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('projectId') || undefined;
  const selectedTimePeriod =
    (searchParams.get('timePeriod') as AnalyticsTimePeriod) ||
    AnalyticsTimePeriod.LAST_MONTH;
  const activeTab = (searchParams.get('tab') as TabValue) || 'analytics';

  const { data: projects } = projectCollectionUtils.useAll();
  const { data, isLoading, isError } =
    platformAnalyticsHooks.useAnalyticsTimeBased(
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
    <LockedFeatureGuard
      featureKey="ANALYTICS"
      locked={!platform.plan.analyticsEnabled}
      lockTitle={t('Unlock Impact Analytics')}
      lockDescription={t(
        'View impact analytics and metrics for the active flows across your platform',
      )}
    >
      <Page>
        <PageHeader
          title={t('Impact')}
          description={t(
            'View impact analytics and metrics for the active flows.',
          )}
        >
          <div className="flex h-9 items-center gap-1 rounded-lg border border-dashed border-gray-7 pr-1 pl-3 text-sm text-gray-11">
            <span className="tabular-nums">
              {t('Updated')} {dayjs(data?.updated).format('MMM DD, hh:mm A')} —{' '}
              {t('Refreshes daily')}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    refreshAnalytics(undefined, {
                      onSuccess: () =>
                        toast.success(t('Data refreshed successfully')),
                    })
                  }
                  disabled={isRefreshing}
                >
                  <RefreshCcw className={cn(isRefreshing && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Refresh analytics')}</TooltipContent>
            </Tooltip>
          </div>

          <Select
            value={selectedTimePeriod}
            onValueChange={handleTimePeriodChange}
          >
            <SelectTrigger className="w-auto">
              <Calendar />
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
        </PageHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="analytics" className="flex-none">
              <LineChart />
              {t('Analytics')}
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-none">
              <List />
              {t('Details')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="flex flex-col gap-4">
            <Summary report={report ?? undefined} />
            <Trends report={report ?? undefined} />
          </TabsContent>

          <TabsContent value="details">
            <FlowsDetails
              report={report}
              isLoading={isLoading}
              isError={isError}
              projects={projects}
            />
          </TabsContent>
        </Tabs>
      </Page>
    </LockedFeatureGuard>
  );
}
