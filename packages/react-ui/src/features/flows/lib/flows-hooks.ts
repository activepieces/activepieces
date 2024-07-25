import { useQuery } from '@tanstack/react-query';

import { flowsApi } from './flows-api';

import { authenticationSession } from '@/lib/authentication-session';

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
      staleTime: Infinity,
    });
  },
};
