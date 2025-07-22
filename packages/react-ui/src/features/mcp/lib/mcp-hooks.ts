import { useQuery, useMutation } from '@tanstack/react-query';

import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  McpWithTools,
  ListMcpsRequest,
  SeekPage,
  assertNotNullOrUndefined,
  McpToolMetadata,
  ToolCallContentBlock,
  ToolCallType,
  McpToolType,
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
  useMcpToolMetadata(contentBlock: ToolCallContentBlock) {
    return useQuery<McpToolMetadata, Error>({
      queryKey: [
        'mcp-tool-metadata',
        contentBlock.toolName,
        contentBlock.toolCallType,
      ],
      queryFn: async () => {
        switch (contentBlock.toolCallType) {
          case ToolCallType.INTERNAL:
            return {
              displayName: contentBlock.displayName,
            };
          case ToolCallType.PIECE: {
            const piece = await piecesApi.get({
              name: contentBlock.pieceName,
              version: contentBlock.pieceVersion,
            });
            const actionMetadata = piece.actions[contentBlock.actionName];
            return {
              displayName:
                actionMetadata?.displayName ?? contentBlock.actionName,
              logoUrl: piece.logoUrl,
            };
          }
          case ToolCallType.FLOW:
            return {
              displayName: contentBlock.displayName,
            };
        }
      },
    });
  },
  useRemoveTool: (mcpId: string, onSuccess?: () => void) => {
    return useMutation({
      mutationFn: async (toolIds: string[]) => {
        const mcp = await mcpApi.get(mcpId);
        const updatedTools =
          mcp?.tools
            ?.filter((tool) => !toolIds.includes(tool.id))
            .map((tool) => {
              switch (tool.type) {
                case McpToolType.PIECE: {
                  return {
                    type: tool.type,
                    mcpId: tool.mcpId,
                    pieceMetadata: tool.pieceMetadata,
                  };
                }
                case McpToolType.FLOW: {
                  return {
                    type: tool.type,
                    mcpId: tool.mcpId,
                    flowId: tool.flowId,
                  };
                }
              }
            }) || [];
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
