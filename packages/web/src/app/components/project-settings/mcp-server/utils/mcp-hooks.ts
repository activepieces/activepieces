import { ErrorCode, isNil } from '@activepieces/core-utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { api } from '@/lib/api';

import { mcpApi } from './mcp-api';

export const MCP_SERVER_QUERY_KEY = ['mcp-server'];
export const MCP_REACH_QUERY_KEY = ['mcp-reach'];

export const mcpHooks = {
  useMcpReach(): McpReach {
    const { data, isLoading } = useQuery({
      queryKey: MCP_REACH_QUERY_KEY,
      queryFn: () => mcpApi.reach(),
      retry: false,
      staleTime: Infinity,
    });

    const projectIds = data?.projectIds ?? null;
    return {
      projectIds,
      isResolved: !isLoading,
      reachesMcp: isNil(projectIds) || projectIds.length > 0,
    };
  },

  useMcpServer(projectId: string, options: { enabled?: boolean } = {}) {
    return useQuery({
      queryKey: [...MCP_SERVER_QUERY_KEY, projectId],
      queryFn: () => mcpApi.get(projectId),
      retry: false,
      enabled: !!projectId && (options.enabled ?? true),
    });
  },

  useUpdateMcpServer(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (input: Parameters<typeof mcpApi.update>[1]) =>
        mcpApi.update(projectId, input),
      onSuccess: (data) => {
        queryClient.setQueryData([...MCP_SERVER_QUERY_KEY, projectId], data);
      },
      onError: (error: Error) => {
        toast.error(
          isMcpServerAccessError(error)
            ? t('You are not allowed to change the tools of this project.')
            : t('The tools could not be saved. Try again.'),
        );
      },
    });
  },

  useRotateMcpToken(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => mcpApi.rotateToken(projectId),
      onSuccess: (data) => {
        queryClient.setQueryData([...MCP_SERVER_QUERY_KEY, projectId], data);
      },
    });
  },
};

type McpReach = {
  projectIds: string[] | null;
  isResolved: boolean;
  reachesMcp: boolean;
};

function isMcpServerAccessError(error: Error | null): boolean {
  return (
    api.isApError(error, ErrorCode.AUTHORIZATION) ||
    api.isApError(error, ErrorCode.PERMISSION_DENIED) ||
    api.isApError(error, ErrorCode.ENTITY_NOT_FOUND)
  );
}
