import { ListMcpOAuthGrantsRequestQuery } from '@activepieces/shared';
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
  useGrants({ request, showErrorDialog }: UseGrantsParams) {
    return useQuery({
      queryKey: [...GRANTS_QUERY_KEY, request],
      queryFn: () => mcpGrantsApi.list(request),
      placeholderData: keepPreviousData,
      meta: { showErrorDialog, loadSubsetOptions: {} },
    });
  },
};

export const mcpGrantsMutations = {
  useRevoke() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ids: string[]) => mcpGrantsApi.revoke({ ids }),
      onSuccess: () => {
        toast.success(t('Access ends within 15 minutes.'));
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
  showErrorDialog: boolean;
};
