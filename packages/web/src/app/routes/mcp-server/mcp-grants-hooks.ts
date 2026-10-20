import {
  ListMcpOAuthGrantsRequestQuery,
  McpOAuthGrant,
} from '@activepieces/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { mcpGrantsApi } from './mcp-grants-api';

const GRANTS_QUERY_KEY = ['mcp-oauth-grants'];

async function listAllGrants({
  request,
}: UseGrantsParams): Promise<McpOAuthGrant[]> {
  const pages: McpOAuthGrant[][] = [];
  let cursor: string | undefined = undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await mcpGrantsApi.list({ ...request, cursor });
    pages.push(result.data);
    if (!result.next) {
      break;
    }
    cursor = result.next;
  }
  return pages.flat();
}

const MAX_PAGES = 20;
const ALL_GRANTS_STALE_MS = 30_000;

export const mcpGrantsQueries = {
  useGrants({ request }: UseGrantsParams) {
    return useQuery({
      queryKey: [...GRANTS_QUERY_KEY, request],
      queryFn: () => mcpGrantsApi.list(request),
      placeholderData: keepPreviousData,
    });
  },
  useAllGrants({ request }: UseGrantsParams) {
    return useQuery({
      queryKey: [...GRANTS_QUERY_KEY, 'all', request],
      queryFn: () => listAllGrants({ request }),
      staleTime: ALL_GRANTS_STALE_MS,
    });
  },
};

export const mcpGrantsMutations = {
  useRevoke() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ids: string[]) => mcpGrantsApi.revoke({ ids }),
      onSuccess: () => {
        toast.success(t('Access ended. The client will ask to sign in again.'));
        queryClient.invalidateQueries({ queryKey: GRANTS_QUERY_KEY });
      },
      onError: () => {
        toast.error(t('Could not revoke access. Try again.'));
      },
    });
  },
};

type UseGrantsParams = {
  request: ListMcpOAuthGrantsRequestQuery;
};
