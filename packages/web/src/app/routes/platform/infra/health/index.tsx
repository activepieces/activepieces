import dayjs from 'dayjs';
import { Calendar } from 'lucide-react';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { listFormat } from '@/components/custom/list/list-format';
import { Page } from '@/components/custom/page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { QueueTab } from './components/queue-tab';
import { RunsTab } from './components/runs-tab';
import { SystemHealthTab } from './components/system-health-tab';
import { healthMetricsQueries } from './lib/health-metrics-hooks';

export default function SettingsHealthPage({
  section,
}: SettingsHealthPageProps) {
  const monthOptions = React.useMemo(buildMonthOptions, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMonth =
    monthOptions.find((option) => option.value === searchParams.get('month'))
      ?.value ?? monthOptions[0].value;

  const range = React.useMemo(() => {
    const month = dayjs(`${selectedMonth}-01`);
    return {
      createdAfter: month.startOf('month').toISOString(),
      createdBefore: month.endOf('month').toISOString(),
    };
  }, [selectedMonth]);

  const runs = healthMetricsQueries.useRunMetrics(range, section === 'runs');
  const queue = healthMetricsQueries.useQueueMetrics(
    range,
    section === 'queue',
  );

  const handleMonthChange = (month: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('month', month);
    setSearchParams(next, { replace: true });
  };

  return (
    <Page>
      <AdminPageHeader page={HEALTH_PAGES[section]}>
        {(section === 'runs' || section === 'queue') && (
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-auto">
              <Calendar />
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
      </AdminPageHeader>
      {section === 'system' && <SystemHealthTab />}
      {section === 'runs' && (
        <RunsTab
          report={runs.data}
          isLoading={runs.isLoading}
          isError={runs.isError}
          onRetry={() => runs.refetch()}
        />
      )}
      {section === 'queue' && (
        <QueueTab
          live={queue.data}
          isLoading={queue.isLoading}
          isError={queue.isError}
          onRetry={() => queue.refetch()}
        />
      )}
    </Page>
  );
}

function buildMonthOptions(): MonthOption[] {
  const now = dayjs();
  return Array.from({ length: 6 }, (_unused, index) => {
    const month = now.subtract(index, 'month').startOf('month');
    return {
      value: month.format('YYYY-MM'),
      label: listFormat.monthYear(month.toDate()),
    };
  });
}

type MonthOption = { value: string; label: string };

type SettingsHealthPageProps = {
  section: 'system' | 'runs' | 'queue';
};

const HEALTH_PAGES = {
  system: 'systemHealth',
  runs: 'runsHealth',
  queue: 'queueHealth',
} as const;
