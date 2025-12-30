'use client';

import { t } from 'i18next';
import { Medal, Trophy, User } from 'lucide-react';
import { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUtils } from '@/lib/utils';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type SortOption = 'flows' | 'timeSaved';

type CreatorsLeaderboardProps = {
  report?: PlatformAnalyticsReport;
  sortBy: SortOption;
  isLoading?: boolean;
};

type CreatorStats = {
  userId: string;
  userName: string;
  userEmail: string;
  flowCount: number;
  minutesSaved: number;
};

export function CreatorsLeaderboard({
  report,
  sortBy,
  isLoading,
}: CreatorsLeaderboardProps) {
  const leaderboardData = useMemo(() => {
    if (!report?.flowsDetails || !report?.users) {
      return [];
    }

    const userMap = new Map(
      report.users.map((user) => [user.id, user]),
    );

    const creatorStatsMap = new Map<string, CreatorStats>();

    report.flowsDetails.forEach((flow) => {
      if (!flow.ownerId) return;

      const user = userMap.get(flow.ownerId);
      if (!user) return;

      const existing = creatorStatsMap.get(flow.ownerId);
      if (existing) {
        existing.flowCount += 1;
        existing.minutesSaved += flow.minutesSaved;
      } else {
        creatorStatsMap.set(flow.ownerId, {
          userId: flow.ownerId,
          userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
          userEmail: user.email,
          flowCount: 1,
          minutesSaved: flow.minutesSaved,
        });
      }
    });

    const data = Array.from(creatorStatsMap.values());
    data.sort((a, b) => {
      if (sortBy === 'flows') {
        return b.flowCount - a.flowCount;
      } else {
        return b.minutesSaved - a.minutesSaved;
      }
    });

    return data;
  }, [report?.flowsDetails, report?.users, sortBy]);

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
          <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">
            {t('No creator data available yet')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboardData.map((creator, index) => (
        <Card key={creator.userId} className="hover:bg-accent/50 transition-colors">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="shrink-0">{getRankIcon(index)}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {creator.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{creator.userName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {creator.userEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('Flows')}
                </p>
                <p className="text-lg font-semibold">{creator.flowCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('Time Saved')}
                </p>
                <p className="text-lg font-semibold">
                  {formatUtils.formatToHoursAndMinutes(creator.minutesSaved)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

