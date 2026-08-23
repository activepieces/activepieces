import { Permission } from '@activepieces/core-utils';
import { McpOAuthClientRow } from '@activepieces/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

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

function useMyClients() {
  return useInfiniteQuery({
    queryKey: MY_CLIENTS_QUERY_KEY,
    queryFn: ({ pageParam }) => mcpClientsApi.listMine({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  });
}

function useProjectClients({
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
}

export const mcpClientsQueries = {
  useClientsReachingProject(): ClientsReachingProject {
    const projectId = authenticationSession.getProjectId()!;
    const currentUserId = authenticationSession.getCurrentUserId();
    const { checkAccess } = useAuthorization();
    const canSeeEveryone = checkAccess(Permission.WRITE_MCP);

    const mine = useMyClients();
    const project = useProjectClients({
      projectId,
      enabled: canSeeEveryone,
    });

    const minePages = mine.data?.pages.flatMap((page) => page.data) ?? [];
    const projectPages = project.data?.pages.flatMap((page) => page.data) ?? [];
    const reachingProject = minePages.filter(
      (row) => row.projectId === null || row.projectId === projectId,
    );
    const byId = new Map(
      [...projectPages, ...reachingProject].map((row) => [row.id, row]),
    );

    return {
      rows: [...byId.values()].map((row) => ({
        ...row,
        isMine: row.userId === undefined || row.userId === currentUserId,
      })),
      canSeeEveryone,
      isLoading: mine.isLoading || project.isLoading,
      hasNextPage: mine.hasNextPage || project.hasNextPage,
      isFetchingNextPage: mine.isFetchingNextPage || project.isFetchingNextPage,
      fetchNextPage: () => {
        if (mine.hasNextPage) {
          mine.fetchNextPage();
        }
        if (project.hasNextPage) {
          project.fetchNextPage();
        }
      },
    };
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

export type McpClientGrantRow = McpOAuthClientRow & { isMine: boolean };

type ClientsReachingProject = {
  rows: McpClientGrantRow[];
  canSeeEveryone: boolean;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};
