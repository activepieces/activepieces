import dayjs from 'dayjs';
import { t } from 'i18next';
import { Calendar } from 'lucide-react';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
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

export default function SettingsHealthPage({
  section,
}: SettingsHealthPageProps) {
  const monthOptions = React.useMemo(buildMonthOptions, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedMonth = searchParams.get('month') || monthOptions[0].value;

  const range = React.useMemo(() => {
    const month = dayjs(`${selectedMonth}-01`);
    return {
      createdAfter: month.startOf('month').toISOString(),
      createdBefore: month.endOf('month').toISOString(),
    };
  }, [selectedMonth]);

  const {
    data: report,
    isLoading: isReportLoading,
    isError: isReportError,
    refetch: refetchReport,
  } = healthMetricsQueries.useRunMetrics(range, section === 'runs');
  const { data: live, isLoading: isLiveLoading } =
    healthMetricsQueries.useQueueMetrics(range, section === 'queue');

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
        {(section === 'runs' || section === 'queue') && (
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

      {section === 'system' && (
        <SystemHealthTab
          onSeeRuns={() =>
            navigate({
              pathname: '/platform/infrastructure/health/runs',
              search: searchParams.toString(),
            })
          }
        />
      )}

      {section === 'runs' && (
        <RunsTab
          report={report}
          isLoading={isReportLoading}
          isError={isReportError}
          onRetry={refetchReport}
        />
      )}

      {section === 'queue' && (
        <QueueTab live={live} isLoading={isLiveLoading} />
      )}
    </div>
  );
}

type HealthSection = 'system' | 'runs' | 'queue';

type MonthOption = { value: string; label: string };

type SettingsHealthPageProps = {
  section: HealthSection;
};
