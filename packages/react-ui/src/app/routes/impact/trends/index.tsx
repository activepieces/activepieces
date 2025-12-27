import dayjs from 'dayjs';
import { t } from 'i18next';
import { FolderKanban, User } from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { DateTimePickerWithRange } from '@/components/ui/date-time-picker-range';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { PlatformAnalyticsReport } from '@activepieces/shared';

import { ActiveFlowsChart } from './active-flows-chart';
import { FlowsCreatedChart } from './flows-created-chart';
import { RunsChart } from './runs-chart';
import { TimeSavedChart } from './time-saved-chart';

type TrendsProps = {
  report?: PlatformAnalyticsReport;
};

const ALL_PROJECTS = 'all';
const ALL_USERS = 'all';

export function Trends({ report }: TrendsProps) {
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >({
    from: dayjs().subtract(3, 'months').toDate(),
    to: dayjs().toDate(),
  });
  const [selectedProject, setSelectedProject] = React.useState(ALL_PROJECTS);
  const [selectedUser, setSelectedUser] = React.useState(ALL_USERS);

  const projects = React.useMemo(() => {
    return report?.topProjects ?? [];
  }, [report?.topProjects]);

  const users = React.useMemo(() => {
    return report?.users ?? [];
  }, [report?.users]);

  const analyticsRequest = React.useMemo(
    () => ({
      projectId:
        selectedProject === ALL_PROJECTS ? undefined : selectedProject,
      userId: selectedUser === ALL_USERS ? undefined : selectedUser,
      fromDate: selectedDateRange?.from?.toISOString(),
      toDate: selectedDateRange?.to?.toISOString(),
    }),
    [selectedProject, selectedUser, selectedDateRange],
  );

  const { data: analyticsData, isLoading } =
    platformAnalyticsHooks.useAnalytics(analyticsRequest);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{t('Trends')}</div>
          <div className="flex items-center gap-3">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t('All Users')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS}>{t('All Users')}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[200px]">
                <FolderKanban className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t('All Projects')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PROJECTS}>
                  {t('All Projects')}
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateTimePickerWithRange
              onChange={setSelectedDateRange}
              from={selectedDateRange?.from?.toISOString()}
              to={selectedDateRange?.to?.toISOString()}
              maxDate={new Date()}
              presetType="past"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <RunsChart
          runsUsage={analyticsData?.runsUsage}
          isLoading={isLoading}
        />
        <TimeSavedChart
          runsUsage={analyticsData?.runsUsage}
          isLoading={isLoading}
        />
        <FlowsCreatedChart
          flowsCreated={analyticsData?.flowsCreated}
          isLoading={isLoading}
        />
        <ActiveFlowsChart
          activeFlowsOverTime={analyticsData?.activeFlowsOverTime}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
