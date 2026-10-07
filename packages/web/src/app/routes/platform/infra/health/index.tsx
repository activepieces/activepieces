import dayjs from 'dayjs';
import { t } from 'i18next';
import { Calendar } from 'lucide-react';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  AdminPage,
  AdminPageHeader,
  adminPageResources,
} from '@/app/components/admin';
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
    <AdminPage width="medium">
      <AdminPageHeader
        title={t('Health')}
        description={t('Check the status of your platform and its components')}
        resources={adminPageResources.health}
      >
        {(section === 'runs' || section === 'queue') && (
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger size="sm" className="w-auto">
              <Calendar className="size-4" />
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

      {section === 'system' && (
        <SystemHealthTab
          onSeeRuns={() =>
            navigate({
              pathname: '/platform/health/runs',
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
    </AdminPage>
  );
}

type HealthSection = 'system' | 'runs' | 'queue';

type MonthOption = { value: string; label: string };

type SettingsHealthPageProps = {
  section: HealthSection;
};
