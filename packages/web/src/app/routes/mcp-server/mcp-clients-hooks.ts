import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { mcpClientsApi } from './mcp-clients-api';

const MY_CLIENTS_QUERY_KEY = ['mcp-oauth-clients-me'];
const PROJECT_CLIENTS_QUERY_KEY = ['mcp-oauth-clients-project'];

function useRevoke(mutationFn: (ids: string[]) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(t('Access ends within 15 minutes.'));
      queryClient.invalidateQueries({ queryKey: MY_CLIENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECT_CLIENTS_QUERY_KEY });
    },
    onError: () => {
      toast.error(t('Could not revoke access. Try again.'));
    },
  });
}

export const mcpClientsQueries = {
  useMyClients() {
    return useInfiniteQuery({
      queryKey: MY_CLIENTS_QUERY_KEY,
      queryFn: ({ pageParam }) => mcpClientsApi.listMine({ cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.next ?? undefined,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },

  useProjectClients({
    projectId,
    enabled,
  }: {
    projectId: string;
    enabled: boolean;
  }) {
    return useInfiniteQuery({
      queryKey: [...PROJECT_CLIENTS_QUERY_KEY, projectId],
      queryFn: ({ pageParam }) =>
        mcpClientsApi.listForProject({ projectId, cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.next ?? undefined,
      enabled,
    });
  },
};

export const mcpClientsMutations = {
  useRevokeMine() {
    return useRevoke((ids) => mcpClientsApi.revokeMine({ ids }));
  },

  useRevokeForProject(projectId: string) {
    return useRevoke((ids) =>
      mcpClientsApi.revokeForProject({ projectId, ids }),
    );
  },
};
