import { t } from 'i18next';
import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/lib/refresh-analytics-context';
import { platformHooks } from '@/hooks/platform-hooks';

import { CreatorsLeaderboard } from './creators-leaderboard';
import { ProjectsLeaderboard } from './projects-leaderboard';

type SortOption = 'flows' | 'timeSaved';

export default function LeaderboardPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading } = platformAnalyticsHooks.useLeaderboard();
  const [creatorsSortBy, setCreatorsSortBy] = useState<SortOption>('flows');
  const [projectsSortBy, setProjectsSortBy] = useState<SortOption>('flows');

  return (
    <RefreshAnalyticsProvider>
        <div className="flex flex-col gap-6 w-full">
          <DashboardPageHeader
            title={
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                <span>{t('Leaderboard')}</span>
              </div>
            }
            description={t(
              'See top performers by flows created and time saved',
            )}
          />

          <Tabs defaultValue="creators" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="creators">{t('Creators')}</TabsTrigger>
              <TabsTrigger value="projects">{t('Projects')}</TabsTrigger>
            </TabsList>

            <TabsContent value="creators">
              <CreatorsLeaderboard
                creators={data?.creators}
                isLoading={isLoading}
                sortBy={creatorsSortBy}
                onSortChange={setCreatorsSortBy}
              />
            </TabsContent>

            <TabsContent value="projects">
              <ProjectsLeaderboard
                projects={data?.projects}
                isLoading={isLoading}
                sortBy={projectsSortBy}
                onSortChange={setProjectsSortBy}
              />
            </TabsContent>
          </Tabs>
        </div>
    </RefreshAnalyticsProvider>
  );
}

