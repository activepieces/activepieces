'use client';

import { t } from 'i18next';
import { Folder, Medal, Trophy } from 'lucide-react';
import { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUtils } from '@/lib/utils';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type SortOption = 'flows' | 'timeSaved';

type ProjectsLeaderboardProps = {
  report?: PlatformAnalyticsReport;
  sortBy: SortOption;
  isLoading?: boolean;
};

type ProjectStats = {
  projectId: string;
  projectName: string;
  flowCount: number;
  minutesSaved: number;
};

export function ProjectsLeaderboard({
  report,
  sortBy,
  isLoading,
}: ProjectsLeaderboardProps) {
  const leaderboardData = useMemo(() => {
    if (!report?.flowsDetails) {
      return [];
    }

    const projectStatsMap = new Map<string, ProjectStats>();

    report.flowsDetails.forEach((flow) => {
      const existing = projectStatsMap.get(flow.projectId);
      if (existing) {
        existing.flowCount += 1;
        existing.minutesSaved += flow.minutesSaved;
      } else {
        projectStatsMap.set(flow.projectId, {
          projectId: flow.projectId,
          projectName: flow.projectName,
          flowCount: 1,
          minutesSaved: flow.minutesSaved,
        });
      }
    });

    const data = Array.from(projectStatsMap.values());
    data.sort((a, b) => {
      if (sortBy === 'flows') {
        return b.flowCount - a.flowCount;
      } else {
        return b.minutesSaved - a.minutesSaved;
      }
    });

    return data;
  }, [report?.flowsDetails, sortBy]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return (
      <span className="flex h-6 w-6 items-center justify-center text-sm font-semibold text-muted-foreground">
        {index + 1}
      </span>
    );
  };

  if (isLoading || !report) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">
            {t('No project data available yet')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboardData.map((project, index) => (
        <Card 
          key={project.projectId} 
          className="hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => window.open(`/projects/${project.projectId}`, '_blank')}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="shrink-0">{getRankIcon(index)}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{project.projectName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('Project')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('Flows')}
                </p>
                <p className="text-lg font-semibold">{project.flowCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('Time Saved')}
                </p>
                <p className="text-lg font-semibold">
                  {formatUtils.formatToHoursAndMinutes(project.minutesSaved)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

