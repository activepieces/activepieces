import { useQuery } from '@tanstack/react-query';

import { ToolCallType, type ToolCallContentBlock } from '@activepieces/shared';

import { piecesApi } from '../pieces/lib/pieces-api';

type ToolMetadata = {
  displayName?: string | null;
  logoUrl?: string | null;
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
          default:
            return { displayName: null, logoUrl: null };
        }
      },
    });
  },
};
