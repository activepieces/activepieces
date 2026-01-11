import { api } from '@/lib/api';
import {
  AnalyticsTimePeriod,
  PlatformAnalyticsReport,
  ProjectLeaderboardItem,
  UserLeaderboardItem,
} from '@activepieces/shared';

export const analyticsApi = {
  get(timePeriod?: AnalyticsTimePeriod): Promise<PlatformAnalyticsReport> {
    return api.get<PlatformAnalyticsReport>('/v1/analytics', { timePeriod });
  },
  refresh(): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics/refresh');
  },
  markAsOutdated(): Promise<void> {
    return api.post<void>('/v1/analytics/mark-outdated');
  },
  getProjectLeaderboard(
    timePeriod: AnalyticsTimePeriod,
  ): Promise<ProjectLeaderboardItem[]> {
    return api.get<ProjectLeaderboardItem[]>(
      '/v1/analytics/project-leaderboard',
      { timePeriod },
    );
  },
  getUserLeaderboard(
    timePeriod: AnalyticsTimePeriod,
  ): Promise<UserLeaderboardItem[]> {
    return api.get<UserLeaderboardItem[]>('/v1/analytics/user-leaderboard', {
      timePeriod,
    });
  },
};
