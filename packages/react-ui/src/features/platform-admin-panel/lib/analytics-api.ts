import { api } from '@/lib/api';
import { AnalyticsReportResponse, ListPlatformProjectsLeaderboardParams, SeekPage } from '@activepieces/shared';

export const analyticsApi = {
  get(): Promise<AnalyticsReportResponse> {
    return api.get<AnalyticsReportResponse>('/v1/analytics');
  },

  listProjectsLeaderBoard(request: ListPlatformProjectsLeaderboardParams) : Promise<SeekPage<ListPlatformProjectsLeaderboardParams>> {
    return api.get<SeekPage<ListPlatformProjectsLeaderboardParams>>('/v1/analytics/leaderboards/platform-projects',request);
  }
};
