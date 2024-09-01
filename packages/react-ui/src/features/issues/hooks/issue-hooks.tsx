import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { authenticationSession } from '@/lib/authentication-session';
import { ApEdition } from '@activepieces/shared';

import { issuesApi } from '../api/issues-api';

export const issueHooks = {
  useIssuesNotification: (edition: ApEdition | null) => {
    return useQuery<boolean, Error>({
      queryKey: [
        t('issues-notification'),
        authenticationSession.getProjectId(),
      ],
      queryFn: async () => {
        if (!edition || edition === ApEdition.COMMUNITY) {
          return false;
        }
        const count = await issuesApi.count();
        return count > 0;
      },
      staleTime: Infinity,
    });
  },
};
