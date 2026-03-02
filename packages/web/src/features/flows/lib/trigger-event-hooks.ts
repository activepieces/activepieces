import { SeekPage, TriggerEventWithPayload } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { triggerEventsApi } from './trigger-events-api';

export const triggerEventHooks = {
  usePollResults: (flowVersionId: string, flowId: string) => {
    const { data: pollResults, refetch } = useQuery<
      SeekPage<TriggerEventWithPayload>
    >({
      queryKey: ['triggerEvents', flowVersionId],
      queryFn: () =>
        triggerEventsApi.list({
          projectId: authenticationSession.getProjectId()!,
          flowId: flowId,
          limit: 5,
          cursor: undefined,
        }),
      staleTime: 0,
    });
    return { pollResults, refetch };
  },
};
