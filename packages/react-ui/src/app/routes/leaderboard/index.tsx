import { t } from 'i18next';
import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { leaderboardHooks } from '@/features/platform-admin/lib/leaderboard-hooks';

import { CreatorsLeaderboard } from './creators-leaderboard';
import { ProjectsLeaderboard } from './projects-leaderboard';

type SortOption = 'flows' | 'timeSaved';

export default function LeaderboardPage() {
  const { data, isLoading } = leaderboardHooks.useLeaderboard();
  const [creatorsSortBy, setCreatorsSortBy] = useState<SortOption>('flows');
  const [projectsSortBy, setProjectsSortBy] = useState<SortOption>('flows');

  return (
    <div className="flex flex-col gap-6 w-full">
      <DashboardPageHeader
        title={
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6" />
            <span>{t('Leaderboard')}</span>
          </div>
        }
        description={t('See top performers by flows created and time saved')}
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
  );
}

