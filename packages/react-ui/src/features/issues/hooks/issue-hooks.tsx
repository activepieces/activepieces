import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { issuesApi } from '../api/issues-api';

export const issueHooks = {
  useIssuesNotification: () => {
    return useQuery<boolean, Error>({
      queryKey: ['issues-notification', authenticationSession.getProjectId()],
      queryFn: async () => {
        console.log('useIssuesNotification');
        const count = await issuesApi.count();
        return count > 0;
      },
      staleTime: Infinity,
    });
  },
};
