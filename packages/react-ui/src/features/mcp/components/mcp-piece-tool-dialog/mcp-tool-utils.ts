import { McpTool, McpToolRequest, McpToolType } from '@activepieces/shared';

export const mcpToolUtils = {
  convertToMcpToolRequest: (tool: McpTool): McpToolRequest => {
    switch (tool.type) {
      case McpToolType.PIECE: {
        return {
          type: tool.type,
          pieceMetadata: tool.pieceMetadata,
          toolName: tool.pieceMetadata.actionName,
        };
      }
      case McpToolType.FLOW: {
        return {
          type: tool.type,
          flowId: tool.flowId,
          toolName: tool.flowId,
        };
      }
    }
  },
};
