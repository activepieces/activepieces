import { t } from 'i18next';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/lib/refresh-analytics-context';
import { downloadFile, formatUtils } from '@/lib/utils';

import { ProjectsLeaderboard, ProjectStats } from './projects-leaderboard';
import { UsersLeaderboard, UserStats } from './users-leaderboard';

export default function LeaderboardPage() {
  const { data, isLoading } = platformAnalyticsHooks.useAnalytics();
  const [activeTab, setActiveTab] = useState('creators');

  const peopleData = useMemo((): UserStats[] => {
    if (!data?.flowsDetails || !data?.users) return [];

    const userMap = new Map(data.users.map((user) => [user.id, user]));
    const creatorStatsMap = new Map<string, UserStats>();

    data.flowsDetails.forEach((flow) => {
      if (!flow.ownerId) return;
      const user = userMap.get(flow.ownerId);
      if (!user) return;

      const existing = creatorStatsMap.get(flow.ownerId);
      if (existing) {
        existing.flowCount += 1;
        existing.minutesSaved += flow.minutesSaved;
      } else {
        creatorStatsMap.set(flow.ownerId, {
          id: flow.ownerId,
          visibleId: flow.ownerId,
          userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
          userEmail: user.email,
          flowCount: 1,
          minutesSaved: flow.minutesSaved,
        });
      }
    });

    return Array.from(creatorStatsMap.values());
  }, [data?.flowsDetails, data?.users]);

  const projectsData = useMemo((): ProjectStats[] => {
    if (!data?.flowsDetails) return [];

    const projectStatsMap = new Map<string, ProjectStats>();

    data.flowsDetails.forEach((flow) => {
      const existing = projectStatsMap.get(flow.projectId);
      if (existing) {
        existing.flowCount += 1;
        existing.minutesSaved += flow.minutesSaved;
      } else {
        projectStatsMap.set(flow.projectId, {
          id: flow.projectId,
          projectId: flow.projectId,
          projectName: flow.projectName,
          flowCount: 1,
          minutesSaved: flow.minutesSaved,
        });
      }
    });

    return Array.from(projectStatsMap.values());
  }, [data?.flowsDetails]);

  const handleDownload = () => {
    if (activeTab === 'creators') {
      if (peopleData.length === 0) return;

      const csvHeader = 'Name,Email,Flows,Time Saved\n';
      const csvContent = peopleData
        .map(
          (person) =>
            `"${person.userName}","${person.userEmail}",${
              person.flowCount
            },"${formatUtils.formatToHoursAndMinutes(person.minutesSaved)}"`,
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
            },"${formatUtils.formatToHoursAndMinutes(project.minutesSaved)}"`,
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
