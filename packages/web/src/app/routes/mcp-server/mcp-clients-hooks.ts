import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { mcpClientsApi } from './mcp-clients-api';

const MY_CLIENTS_QUERY_KEY = ['mcp-oauth-clients-me'];

export const mcpClientsQueries = {
  useMyClients() {
    const query = useInfiniteQuery({
      queryKey: MY_CLIENTS_QUERY_KEY,
      queryFn: ({ pageParam }) => mcpClientsApi.listMine({ cursor: pageParam }),
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

export const mcpClientsMutations = {
  useRevokeMine() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ids: string[]) => mcpClientsApi.revokeMine({ ids }),
      onSuccess: () => {
        toast.success(t('Access ends within 15 minutes.'));
        queryClient.invalidateQueries({ queryKey: MY_CLIENTS_QUERY_KEY });
      },
      onError: () => {
        toast.error(t('Could not revoke access. Try again.'));
      },
    });
  },
};
