import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  Activity,
  Calendar,
  HeartPulse,
  LineChart,
  ShieldAlert,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { NotificationDot } from '@/components/custom/notification-dot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  healthQueries,
  useSecurityAdvisoryStore,
  useUnseenSecurityAdvisories,
} from '@/features/platform-admin';

import { AdvisoryItem } from './advisory-item';
import { CheckItem } from './components/check-item';
import { QueueTab } from './components/queue-tab';
import { RunsTab } from './components/runs-tab';
import { SystemHealthTab } from './components/system-health-tab';
import { healthMetricsQueries } from './lib/health-metrics-hooks';

type TabValue = 'system' | 'runs' | 'queue' | 'security';

type MonthOption = { value: string; label: string };

function buildMonthOptions(): MonthOption[] {
  const now = dayjs();
  return Array.from({ length: 6 }, (_unused, index) => {
    const month = now.subtract(index, 'month');
    return {
      value: month.format('YYYY-MM'),
      label: month.format('MMMM YYYY'),
    };
  });
}

export default function SettingsHealthPage() {
  const monthOptions = React.useMemo(buildMonthOptions, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabValue) || 'system';
  const selectedMonth = searchParams.get('month') || monthOptions[0].value;

  const { data: advisories, isPending: advisoriesPending } =
    healthQueries.useSecurityAdvisories({ showErrorDialog: true });
  const advisoryList = advisories?.advisories ?? [];
  const showPartialNote = advisories?.partial === true;
  const unseen = useUnseenSecurityAdvisories();
  const markSeen = useSecurityAdvisoryStore((s) => s.markSeen);

  const criticalIdsKey = React.useMemo(
    () =>
      (advisories?.advisories ?? [])
        .filter((a) => a.severity === 'high' || a.severity === 'critical')
        .map((a) => a.id)
        .sort()
        .join('|'),
    [advisories],
  );

  useEffect(() => {
    if (activeTab !== 'security' || !criticalIdsKey) return;
    markSeen(criticalIdsKey.split('|'));
  }, [activeTab, criticalIdsKey, markSeen]);

  const range = React.useMemo(() => {
    const month = dayjs(`${selectedMonth}-01`);
    return {
      createdAfter: month.startOf('month').toISOString(),
      createdBefore: month.endOf('month').toISOString(),
    };
  }, [selectedMonth]);

  const { data: report, isLoading: isReportLoading } =
    healthMetricsQueries.useRunMetrics(range, activeTab === 'runs');
  const { data: live, isLoading: isLiveLoading } =
    healthMetricsQueries.useQueueMetrics(range, activeTab === 'queue');

  const setTab = (tab: TabValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'system') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleMonthChange = (month: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('month', month);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="flex flex-col w-full max-w-[40rem] mx-auto gap-4 px-4">
      <DashboardPageHeader
        title={t('Health')}
        description={t('Check the status of your platform and its components')}
      >
        {(activeTab === 'runs' || activeTab === 'queue') && (
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-auto gap-2 h-8">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" align="end">
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </DashboardPageHeader>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setTab(value as TabValue)}
        className="w-full"
      >
        <TabsList variant="outline" className="border-b w-full">
          <TabsTrigger variant="outline" value="system">
            <HeartPulse className="w-4 h-4 mr-2" />
            {t('System Health')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="runs">
            <LineChart className="w-4 h-4 mr-2" />
            {t('Runs Health')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="queue">
            <Activity className="w-4 h-4 mr-2" />
            {t('Queue Health')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="security">
            <ShieldAlert className="w-4 h-4 mr-2" />
            {t('Security Issues')}
            {unseen.length > 0 && (
              <NotificationDot className="ml-1.5" count={unseen.length} />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemHealthTab onSeeRuns={() => setTab('runs')} />
        </TabsContent>

        <TabsContent value="runs">
          <RunsTab report={report} isLoading={isReportLoading} />
        </TabsContent>

        <TabsContent value="queue">
          <QueueTab live={live} isLoading={isLiveLoading} />
        </TabsContent>

        <TabsContent value="security" className="mt-4 pb-6" tabIndex={-1}>
          <div className="flex flex-col gap-4">
            {showPartialNote && (
              <p className="text-xs text-muted-foreground">
                {t(
                  'Some advisory sources are unavailable; the list may be incomplete.',
                )}
              </p>
            )}
            {advisoriesPending ? (
              <CheckItem
                id="security-advisories"
                title={t('Security advisories')}
                icon={<ShieldAlert />}
                isChecked={false}
                message={''}
                loading={true}
              />
            ) : advisoryList.length === 0 ? (
              <CheckItem
                id="security-advisories"
                title={t('Security advisories')}
                icon={<ShieldAlert />}
                isChecked={true}
                message={t('No advisories affect your version.')}
                loading={false}
              />
            ) : (
              advisoryList.map((advisory) => (
                <AdvisoryItem key={advisory.id} advisory={advisory} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
