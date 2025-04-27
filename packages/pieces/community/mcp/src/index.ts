import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { replyToMcpClient } from "./lib/actions/reply-to-mcp-client";
import { mcpTool } from "./lib/triggers/mcp-tool";

export const mcp = createPiece({
  displayName: "MCP",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.50.2',
  logoUrl: "https://cdn.activepieces.com/pieces/mcp.svg",
  authors: ['Gamal72', 'hazemadelkhalel'],
  description: 'Connect to your hosted MCP Server using any MCP client to communicate with tools',
  actions: [replyToMcpClient],
  triggers: [mcpTool],
});
