import { AnalyticsTimePeriod } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Calendar, RefreshCw } from 'lucide-react';
import { useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { toast } from 'sonner';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { Page, PageHeader } from '@/components/custom/page';
import { PageTabs } from '@/components/custom/page-tabs';
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
import {
  platformAnalyticsHooks,
  RefreshAnalyticsContext,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';
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

  const tabHref = (tab: TabValue) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'analytics') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const search = params.toString();
    return search ? `/impact?${search}` : '/impact';
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
      lockTitle={t('Impact analytics')}
      lockDescription={t(
        'Runs turned into hours saved, per flow and per project, in a report for the people who signed the budget.',
      )}
    >
      <Page>
        <PageHeader
          title={t('Impact')}
          description={t(
            'What your flows gave back: how much ran, the hours it saved, and where they came from.',
          )}
        >
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={t('Refresh analytics')}
                onClick={() =>
                  refreshAnalytics(undefined, {
                    onSuccess: () =>
                      toast.success(t('Data refreshed successfully')),
                  })
                }
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(isRefreshing && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {data?.updated
                ? t('Updated {time}. Refreshes daily.', {
                    time: formatUtils.formatDate(new Date(data.updated)),
                  })
                : t('Refreshes daily')}
            </TooltipContent>
          </Tooltip>
        </PageHeader>

        <PageTabs
          tabs={[
            [
              {
                to: tabHref('analytics'),
                label: t('Analytics'),
                active: activeTab === 'analytics',
              },
              {
                to: tabHref('details'),
                label: t('Flows'),
                active: activeTab === 'details',
              },
            ],
          ]}
        />

        {activeTab === 'details' ? (
          <FlowsDetails
            report={report}
            isLoading={isLoading}
            isError={isError}
            projects={projects}
          />
        ) : (
          <>
            <Summary report={report ?? undefined} />
            <Trends report={report ?? undefined} />
          </>
        )}
      </Page>
    </LockedFeatureGuard>
  );
}
