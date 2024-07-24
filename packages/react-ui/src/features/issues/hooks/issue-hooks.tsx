import { useQuery } from '@tanstack/react-query';

import { issuesApi } from '../api/issues-api';

import { authenticationSession } from '@/lib/authentication-session';

export const issueHooks = {
  useIssuesNotification: () => {
    return useQuery<boolean, Error>({
      queryKey: ['issues-notification', authenticationSession.getProjectId()],
      queryFn: async () => {
        const count = await issuesApi.count();
        return count > 0;
      },
      staleTime: Infinity,
    });
  },
};
