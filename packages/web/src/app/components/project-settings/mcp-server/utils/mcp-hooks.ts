import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { mcpApi } from './mcp-api';

export const MCP_SERVER_QUERY_KEY = ['mcp-server'];

export const mcpHooks = {
  useMcpServer(projectId: string, options: { enabled?: boolean } = {}) {
    return useQuery({
      queryKey: [...MCP_SERVER_QUERY_KEY, projectId],
      queryFn: () => mcpApi.get(projectId),
      retry: false,
      enabled: !!projectId && (options.enabled ?? true),
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
