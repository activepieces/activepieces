import { t } from 'i18next';
import { Calendar, Download, RefreshCcwIcon } from 'lucide-react';
import { useContext, useMemo, useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
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
import {
  RefreshAnalyticsContext,
  RefreshAnalyticsProvider,
} from '@/features/platform-admin/lib/refresh-analytics-context';
import { downloadFile, formatUtils } from '@/lib/utils';
import { AnalyticsTimePeriod } from '@activepieces/shared';

import { ProjectsLeaderboard, ProjectStats } from './projects-leaderboard';
import { UsersLeaderboard, UserStats } from './users-leaderboard';

export default function LeaderboardPage() {
  const [timePeriod, setTimePeriod] = useState<AnalyticsTimePeriod>(
    AnalyticsTimePeriod.ALL_TIME,
  );
  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    platformAnalyticsHooks.useAnalytics();
  const { data: usersLeaderboardData, isLoading: isUsersLoading } =
    platformAnalyticsHooks.useUsersLeaderboard(timePeriod);
  const { data: projectsLeaderboardData, isLoading: isProjectsLoading } =
    platformAnalyticsHooks.useProjectLeaderboard(timePeriod);
  const [activeTab, setActiveTab] = useState('creators');

  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);

  const isLoading = isAnalyticsLoading || isUsersLoading || isProjectsLoading;

  const peopleData = useMemo((): UserStats[] => {
    if (isLoading || !analyticsData?.users || !usersLeaderboardData) {
      return [];
    }

    const userMap = new Map(analyticsData.users.map((user) => [user.id, user]));

    return usersLeaderboardData
      .map((item) => {
        const user = userMap.get(item.userId);
        if (!user) return null;

        return {
          id: item.userId,
          visibleId: item.userId,
          userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
          userEmail: user.email,
          flowCount: item.flowCount ?? 0,
          minutesSaved: item.minutesSaved ?? 0,
        };
      })
      .filter((item): item is UserStats => item !== null);
  }, [analyticsData?.users, usersLeaderboardData, isLoading]);

  const projectsData = useMemo((): ProjectStats[] => {
    if (isLoading || !projectsLeaderboardData) {
      return [];
    }

    return projectsLeaderboardData.map((item) => ({
      id: item.projectId,
      projectId: item.projectId,
      projectName: item.projectName,
      flowCount: item.flowCount ?? 0,
      minutesSaved: item.minutesSaved ?? 0,
    }));
  }, [projectsLeaderboardData, isLoading]);

  const handleDownload = () => {
    if (activeTab === 'creators') {
      if (peopleData.length === 0) return;

      const csvHeader = 'Name,Email,Flows,Time Saved\n';
      const csvContent = peopleData
        .map(
          (person) =>
            `"${person.userName}","${person.userEmail}",${
              person.flowCount
            },"${formatUtils.formatToHoursAndMinutes(
              person.minutesSaved || 0,
            )}"`,
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
            },"${formatUtils.formatToHoursAndMinutes(
              project.minutesSaved || 0,
            )}"`,
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
          title={
            <div className="flex items-center gap-3">
              <ApSidebarToggle />
              <Separator orientation="vertical" className="h-5 mr-2" />
              <span>{t('Leaderboard')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => refreshAnalytics()}
                    disabled={isRefreshing}
                  >
                    <RefreshCcwIcon
                      className={`w-4 h-4 ${
                        isRefreshing ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Refresh analytics')}</TooltipContent>
              </Tooltip>
            </div>
          }
          description={t('See top performers by flows created and time saved')}
        >
          <div className="flex items-center gap-2">
            <Select
              value={timePeriod}
              onValueChange={(value) =>
                setTimePeriod(value as AnalyticsTimePeriod)
              }
            >
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AnalyticsTimePeriod.LAST_WEEK}>
                  {t('Last 7 days')}
                </SelectItem>
                <SelectItem value={AnalyticsTimePeriod.LAST_MONTH}>
                  {t('Last 30 days')}
                </SelectItem>
                <SelectItem value={AnalyticsTimePeriod.ALL_TIME}>
                  {t('All Time')}
                </SelectItem>
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
        </DashboardPageHeader>

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
