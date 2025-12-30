import { t } from 'i18next';
import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import { RefreshAnalyticsProvider } from '@/features/platform-admin/lib/refresh-analytics-context';

import { CreatorsLeaderboard } from './creators-leaderboard';
import { ProjectsLeaderboard } from './projects-leaderboard';

type SortOption = 'flows' | 'timeSaved';

export default function LeaderboardPage() {
  const [creatorsSortBy, setCreatorsSortBy] = useState<SortOption>('flows');
  const [projectsSortBy, setProjectsSortBy] = useState<SortOption>('flows');
  const { data, isLoading } = platformAnalyticsHooks.useAnalytics();

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
          <div className="flex items-center justify-between mb-4">
            <TabsList variant="outline">
              <TabsTrigger variant="outline" value="creators">{t('Creators')}</TabsTrigger>
              <TabsTrigger variant="outline" value="projects">{t('Projects')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="creators" className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">
                {t('Sort by')}:
              </span>
              <Select
                value={creatorsSortBy}
                onValueChange={(value) =>
                  setCreatorsSortBy(value as SortOption)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flows">{t('Number of Flows')}</SelectItem>
                  <SelectItem value="timeSaved">{t('Time Saved')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CreatorsLeaderboard
              report={data}
              sortBy={creatorsSortBy}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">
                {t('Sort by')}:
              </span>
              <Select
                value={projectsSortBy}
                onValueChange={(value) =>
                  setProjectsSortBy(value as SortOption)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flows">{t('Number of Flows')}</SelectItem>
                  <SelectItem value="timeSaved">{t('Time Saved')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ProjectsLeaderboard
              report={data}
              sortBy={projectsSortBy}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RefreshAnalyticsProvider>
  );
}