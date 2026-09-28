import { ListMcpActivityRequestQuery } from '@activepieces/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { mcpActivityApi } from './mcp-activity-api';

const ACTIVITY_QUERY_KEY = ['mcp-activity'];

export const mcpActivityQueries = {
  useActivity({ request }: UseActivityParams) {
    return useQuery({
      queryKey: [...ACTIVITY_QUERY_KEY, request],
      queryFn: () => mcpActivityApi.list(request),
      placeholderData: keepPreviousData,
    });
  },

  usePayload({ id }: UsePayloadParams) {
    return useQuery({
      queryKey: [...ACTIVITY_QUERY_KEY, 'payload', id],
      queryFn: () => mcpActivityApi.getPayload(id),
      staleTime: Infinity,
      retry: false,
    });
  },
};

type UseActivityParams = {
  request: ListMcpActivityRequestQuery;
};

type UsePayloadParams = {
  id: string;
};
