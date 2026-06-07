import dayjs from 'dayjs';
import { t } from 'i18next';
import { Activity, Calendar, HeartPulse, LineChart } from 'lucide-react';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { QueueTab } from './components/queue-tab';
import { RunsTab } from './components/runs-tab';
import { SystemHealthTab } from './components/system-health-tab';
import { healthMetricsQueries } from './lib/health-metrics-hooks';

type TabValue = 'system' | 'runs' | 'queue';

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
    healthMetricsQueries.useQueueMetrics(activeTab === 'queue');

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
        {activeTab === 'runs' && (
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
      </Tabs>
    </div>
  );
}
