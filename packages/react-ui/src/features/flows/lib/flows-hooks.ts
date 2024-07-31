import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { flowsApi } from './flows-api';

export const flowsHooks = {
  useFlows: () => {
    return useQuery({
      queryKey: ['flows', authenticationSession.getProjectId()],
      queryFn: async () => {
        return await flowsApi.list({
          projectId: authenticationSession.getProjectId(),
          cursor: undefined,
        });
      },
      staleTime: 0,
    });
  },
};
