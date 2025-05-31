import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { Alert } from '@activepieces/ee-shared';

import { alertsApi } from './api';
import { alertsKeys } from './keys';

export const useAlertsEmailList = () =>
  useQuery<Alert[], Error, Alert[]>({
    queryKey: alertsKeys.all,
    queryFn: async () => {
      const page = await alertsApi.list({
        projectId: authenticationSession.getProjectId()!,
        limit: 100,
      });
      return page.data;
    },
  });
