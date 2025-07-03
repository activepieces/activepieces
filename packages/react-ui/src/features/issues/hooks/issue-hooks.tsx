import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { authenticationSession } from '@/lib/authentication-session';

import { issuesApi } from '../api/issues-api';

export const issueHooks = {
  useIssuesNotification: () => {
    return useQuery<boolean, Error>({
      queryKey: [
        t('issues-notification'),
        authenticationSession.getProjectId(),
      ],
      queryFn: async () => {
        const count = await issuesApi.count();
        return count > 0;
      },
      staleTime: Infinity,
    });
  },
};
