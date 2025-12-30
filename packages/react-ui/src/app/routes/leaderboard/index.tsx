import { t } from 'i18next';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/lib/refresh-analytics-context';

import { CreatorsLeaderboard } from './creators-leaderboard';
import { ProjectsLeaderboard } from './projects-leaderboard';

export default function LeaderboardPage() {
  const { data, isLoading } = platformAnalyticsHooks.useAnalytics();

  return (
    <RefreshAnalyticsProvider>
      <div className="flex flex-col gap-2 w-full">
        <DashboardPageHeader
          title={t('Leaderboard')}
          description={t(
            'See top performers by flows created and time saved',
          )}
        />

        <Tabs defaultValue="creators" className="w-full">
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
            <CreatorsLeaderboard
              report={data}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsLeaderboard
              report={data}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RefreshAnalyticsProvider>
  );
}