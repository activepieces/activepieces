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
  McpToolRequest,
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
  useMcp: (id: string | undefined) => {
    return useQuery<McpWithTools, Error>({
      queryKey: ['mcp', id],
      queryFn: () => mcpApi.get(id!),
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
  useUpdateTools: (mcpId: string | undefined, onSuccess?: () => void) =>
    useMutation({
      mutationFn: (tools: McpToolRequest[]) => mcpApi.update(mcpId!, { tools }),
      onSuccess,
    }),
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
