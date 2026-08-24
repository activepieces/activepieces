import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { mcpGrantsApi } from './mcp-grants-api';

const MY_GRANTS_QUERY_KEY = ['mcp-oauth-grants-me'];

export const mcpGrantsQueries = {
  useMyGrants() {
    const query = useInfiniteQuery({
      queryKey: MY_GRANTS_QUERY_KEY,
      queryFn: ({ pageParam }) => mcpGrantsApi.listMine({ cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.next ?? undefined,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });

    return {
      ...query,
      rows: query.data?.pages.flatMap((page) => page.data) ?? [],
    };
  },
};

export const mcpGrantsMutations = {
  useRevokeMine() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ids: string[]) => mcpGrantsApi.revokeMine({ ids }),
      onSuccess: () => {
        toast.success(t('Access ends within 15 minutes.'));
        queryClient.invalidateQueries({ queryKey: MY_GRANTS_QUERY_KEY });
      },
      onError: () => {
        toast.error(t('Could not revoke access. Try again.'));
      },
    });
  },
};
