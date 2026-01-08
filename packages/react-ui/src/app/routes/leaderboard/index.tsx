import { t } from 'i18next';
import { Calendar, Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
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
  platformAnalyticsHooks,
  TimePeriod as TimePeriodEnum,
} from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/lib/refresh-analytics-context';
import { downloadFile, formatUtils } from '@/lib/utils';

import { ProjectsLeaderboard, ProjectStats } from './projects-leaderboard';
import { UsersLeaderboard, UserStats } from './users-leaderboard';

export type TimePeriod = 'weekly' | 'monthly' | '3-months' | 'all-time';

function mapTimePeriodToEnum(timePeriod: TimePeriod): TimePeriodEnum {
  switch (timePeriod) {
    case 'weekly':
      return TimePeriodEnum.LAST_WEEK;
    case 'monthly':
      return TimePeriodEnum.LAST_MONTH;
    case '3-months':
      return TimePeriodEnum.LAST_THREE_MONTHS;
    case 'all-time':
      return TimePeriodEnum.ALL_TIME;
    default:
      return TimePeriodEnum.LAST_MONTH;
  }
}

export default function LeaderboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const timePeriodEnum = mapTimePeriodToEnum(timePeriod);
  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    platformAnalyticsHooks.useAnalytics();
  const usersLeaderboardResult = platformAnalyticsHooks.useUsersLeaderboard(
    timePeriodEnum,
  );
  const projectsLeaderboardResult =
    platformAnalyticsHooks.useProjectLeaderboard(timePeriodEnum);
  const [activeTab, setActiveTab] = useState('creators');

  const isLoading =
    isAnalyticsLoading ||
    (typeof usersLeaderboardResult === 'object' &&
      'isLoading' in usersLeaderboardResult &&
      usersLeaderboardResult.isLoading) ||
    (typeof projectsLeaderboardResult === 'object' &&
      'isLoading' in projectsLeaderboardResult &&
      projectsLeaderboardResult.isLoading);

  const peopleData = useMemo((): UserStats[] => {
    if (
      isLoading ||
      !analyticsData?.users ||
      !Array.isArray(usersLeaderboardResult)
    ) {
      return [];
    }

    const userMap = new Map(
      analyticsData.users.map((user) => [user.id, user]),
    );

    return usersLeaderboardResult
      .map((item) => {
        const user = userMap.get(item.userId);
        if (!user) return null;

        return {
          id: item.userId,
          visibleId: item.userId,
          userName:
            `${user.firstName} ${user.lastName}`.trim() || user.email,
          userEmail: user.email,
          flowCount: item.flowCount ?? 0,
          minutesSaved: item.minutesSaved ?? 0,
        };
      })
      .filter((item): item is UserStats => item !== null);
  }, [
    analyticsData?.users,
    usersLeaderboardResult,
    isLoading,
  ]);

  const projectsData = useMemo((): ProjectStats[] => {
    if (isLoading || !Array.isArray(projectsLeaderboardResult)) {
      return [];
    }

    return projectsLeaderboardResult.map((item) => ({
      id: item.projectId,
      projectId: item.projectId,
      projectName: item.projectName,
      flowCount: item.flowCount ?? 0,
      minutesSaved: item.minutesSaved ?? 0,
    }));
  }, [projectsLeaderboardResult, isLoading]);

  const handleDownload = () => {
    if (activeTab === 'creators') {
      if (peopleData.length === 0) return;

      const csvHeader = 'Name,Email,Flows,Time Saved\n';
      const csvContent = peopleData
        .map(
          (person) =>
            `"${person.userName}","${person.userEmail}",${
              person.flowCount
            },"${formatUtils.formatToHoursAndMinutes(person.minutesSaved || 0)}"`,
        )
        .join('\n');

      downloadFile({
        obj: csvHeader + csvContent,
        fileName: 'people-leaderboard',
        extension: 'csv',
      });
    } else {
      if (projectsData.length === 0) return;

      const csvHeader = 'Project,Flows,Time Saved\n';
      const csvContent = projectsData
        .map(
          (project) =>
            `"${project.projectName}",${
              project.flowCount
            },"${formatUtils.formatToHoursAndMinutes(project.minutesSaved || 0)}"`,
        )
        .join('\n');

      downloadFile({
        obj: csvHeader + csvContent,
        fileName: 'projects-leaderboard',
        extension: 'csv',
      });
    }
  };

  const isDownloadDisabled =
    isLoading ||
    (activeTab === 'creators' && peopleData.length === 0) ||
    (activeTab === 'projects' && projectsData.length === 0);

  return (
    <RefreshAnalyticsProvider>
      <div className="flex flex-col gap-2 w-full">
        <DashboardPageHeader
          title={t('Leaderboard')}
          description={t('See top performers by flows created and time saved')}
        />

        <Tabs
          defaultValue="creators"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList variant="outline">
              <TabsTrigger variant="outline" value="creators">
                {t('People')}
              </TabsTrigger>
              <TabsTrigger variant="outline" value="projects">
                {t('Projects')}
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('Weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('Monthly')}</SelectItem>
                  <SelectItem value="3-months">{t('3 Months')}</SelectItem>
                  <SelectItem value="all-time">{t('All Time')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloadDisabled}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('Download')}
              </Button>
            </div>
          </div>

          <TabsContent value="creators">
            <UsersLeaderboard data={peopleData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsLeaderboard data={projectsData} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </RefreshAnalyticsProvider>
  );
}
