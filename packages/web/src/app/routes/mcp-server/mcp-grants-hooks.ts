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

export const mcpGrantsQueries = {
  useGrants({ request }: UseGrantsParams) {
    return useQuery({
      queryKey: [...GRANTS_QUERY_KEY, request],
      queryFn: () => mcpGrantsApi.list(request),
      placeholderData: keepPreviousData,
    });
  },
  useAllGrants({ request, refetchInterval }: UseAllGrantsParams) {
    return useQuery({
      queryKey: [...GRANTS_QUERY_KEY, 'all', request],
      queryFn: () => listAllGrants({ request }),
      refetchInterval,
    });
  },
};

async function listAllGrants({
  request,
}: {
  request: AllGrantsRequest;
}): Promise<McpOAuthGrant[]> {
  const collect = async ({
    cursor,
    pagesLeft,
  }: {
    cursor: string | undefined;
    pagesLeft: number;
  }): Promise<McpOAuthGrant[]> => {
    const page = await mcpGrantsApi.list({
      ...request,
      cursor,
      limit: PAGE_SIZE,
    });
    if (!page.next || pagesLeft <= 1) return page.data;
    const rest = await collect({ cursor: page.next, pagesLeft: pagesLeft - 1 });
    return [...page.data, ...rest];
  };
  return collect({ cursor: undefined, pagesLeft: MAX_PAGES });
}

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

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

type UseGrantsParams = {
  request: ListMcpOAuthGrantsRequestQuery;
};

type AllGrantsRequest = Omit<
  ListMcpOAuthGrantsRequestQuery,
  'cursor' | 'limit'
>;

type UseAllGrantsParams = {
  request: AllGrantsRequest;
  refetchInterval: () => number | false;
};
