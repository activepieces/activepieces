import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { flowsApi } from './flows-api';
import { ListFlowsRequest } from '@activepieces/shared';

export const flowsHooks = {
  useFlows: (request: Omit<ListFlowsRequest, 'projectId'>) => {
    return useQuery({
      queryKey: ['flows', authenticationSession.getProjectId()],
      queryFn: async () => {
        return await flowsApi.list({
          ...request,
          projectId: authenticationSession.getProjectId(),
        });
      },
      staleTime: 5 * 1000,
    });
  },
};
