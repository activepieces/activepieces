import { ToolCallType, type ToolCallContentBlock } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { piecesApi } from '../pieces/api/pieces-api';

type ToolMetadata = {
  displayName?: string | null;
  logoUrl?: string | null;
  iconType?: 'knowledge-base' | null;
};

export const agentToolHooks = {
  useToolMetadata(contentBlock: ToolCallContentBlock) {
    return useQuery<ToolMetadata, Error>({
      queryKey: [
        'mcp-tool-metadata',
        contentBlock.toolName,
        contentBlock.toolCallType,
      ],
      queryFn: async () => {
        switch (contentBlock.toolCallType) {
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
              logoUrl: null,
            };
          case ToolCallType.KNOWLEDGE_BASE:
            return {
              displayName: contentBlock.displayName ?? contentBlock.toolName,
              logoUrl: null,
              iconType: 'knowledge-base',
            };
          case ToolCallType.MCP:
          case ToolCallType.UNKNOWN:
            return {
              displayName: contentBlock.displayName ?? contentBlock.toolName,
              logoUrl: null,
            };
          default:
            return { displayName: null, logoUrl: null };
        }
      },
    });
  },
};
