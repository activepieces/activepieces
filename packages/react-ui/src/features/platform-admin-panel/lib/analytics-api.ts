import { api } from '@/lib/api';
import { AnalyticsReportResponse, ListPlatformProjectsLeaderboardParams, PlatfromProjectLeaderBoardRow, SeekPage } from '@activepieces/shared';

export const analyticsApi = {
  get(): Promise<AnalyticsReportResponse> {
    return api.get<AnalyticsReportResponse>('/v1/analytics');
  },

  listProjectsLeaderBoard(request: ListPlatformProjectsLeaderboardParams) : Promise<SeekPage<PlatfromProjectLeaderBoardRow>> {
    return api.get<SeekPage<PlatfromProjectLeaderBoardRow>>('/v1/analytics/leaderboards/platform-projects',request);
  }
};
