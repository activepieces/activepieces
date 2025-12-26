import { useQuery } from '@tanstack/react-query';

import { leaderboardApi } from './leaderboard-api';

const leaderboardQueryKey = ['leaderboard'];

export const leaderboardHooks = {
  useLeaderboard: () => {
    const { data, isLoading } = useQuery({
      queryKey: leaderboardQueryKey,
      queryFn: () => leaderboardApi.get(),
    });
    return { data, isLoading };
  },
};

