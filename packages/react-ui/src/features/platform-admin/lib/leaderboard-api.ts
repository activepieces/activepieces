import { api } from '@/lib/api';
import { LeaderboardReport } from '@activepieces/shared';

export const leaderboardApi = {
  get(): Promise<LeaderboardReport> {
    return api.get<LeaderboardReport>('/v1/leaderboard');
  },
};

