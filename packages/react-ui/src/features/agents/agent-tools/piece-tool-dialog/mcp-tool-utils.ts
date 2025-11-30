import { Tool, McpToolRequest, ToolType } from '@activepieces/shared';

export const mcpToolUtils = {
  convertToMcpToolRequest: (tool: Tool): McpToolRequest => {
    switch (tool.type) {
      case ToolType.PIECE: {
        return {
          type: tool.type,
          pieceMetadata: tool.pieceMetadata,
          toolName: tool.pieceMetadata.actionName,
        };
      }
      case ToolType.FLOW: {
        return {
          type: tool.type,
          flowId: tool.flowId,
          toolName: tool.flowId,
        };
      }
    }
  },
};
