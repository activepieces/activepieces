import { useQuery, useMutation } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import {
  McpWithTools,
  ListMcpsRequest,
  SeekPage,
  assertNotNullOrUndefined,
} from '@activepieces/shared';

import { mcpApi } from './mcp-api';

export const mcpHooks = {
  useMcps: (request: Omit<ListMcpsRequest, 'projectId'>) => {
    const projectId = authenticationSession.getProjectId();
    assertNotNullOrUndefined(projectId, 'projectId is not set');
    return useQuery<SeekPage<McpWithTools>, Error>({
      queryKey: ['mcp-servers', request, projectId],
      queryFn: () =>
        mcpApi.list({
          ...request,
          projectId,
        }),
      staleTime: 0,
    });
  },
  useMcp: (id: string) => {
    return useQuery<McpWithTools, Error>({
      queryKey: ['mcp', id],
      queryFn: () => mcpApi.get(id),
      enabled: !!id,
    });
  },
  useRemoveTool: (mcpId: string, onSuccess?: () => void) => {
    return useMutation({
      mutationFn: async (toolId: string) => {
        const mcp = await mcpApi.get(mcpId);
        const updatedTools =
          mcp?.tools
            ?.filter((tool) => tool.id !== toolId)
            .map((tool) => ({
              type: tool.type,
              mcpId: tool.mcpId,
              pieceMetadata: tool.pieceMetadata,
              flowId: tool.flowId,
            })) || [];

        return await mcpApi.update(mcpId, { tools: updatedTools });
      },
      onSuccess,
    });
  },
  useCreateMcp: () => {
    const projectId = authenticationSession.getProjectId();
    assertNotNullOrUndefined(projectId, 'projectId is not set');
    return useMutation({
      mutationFn: async (name: string) => {
        return mcpApi.create({
          name,
          projectId,
        });
      },
    });
  },
  useDeleteMcp: () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await mcpApi.delete(id);
      },
    });
  },
};
