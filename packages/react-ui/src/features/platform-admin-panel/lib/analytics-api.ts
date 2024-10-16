import { api } from '@/lib/api';
import {
  AnalyticsReportResponse,
  ListPlatformProjectsLeaderboardParams,
  PlatformProjectLeaderBoardRow,
  SeekPage,
} from '@activepieces/shared';

export const analyticsApi = {
  get(): Promise<AnalyticsReportResponse> {
    return api.get<AnalyticsReportResponse>('/v1/analytics');
  },

  listProjectsLeaderBoard(
    request: ListPlatformProjectsLeaderboardParams,
  ): Promise<SeekPage<PlatformProjectLeaderBoardRow>> {
    return api.get<SeekPage<PlatformProjectLeaderBoardRow>>(
      '/v1/analytics/leaderboards/platform-projects',
      request,
    );
  },
};
