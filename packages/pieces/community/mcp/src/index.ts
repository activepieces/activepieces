
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { returnResponse } from "./lib/actions/return-response";
import { mcpTool } from "./lib/triggers/mcp-tool";

export const mcp = createPiece({
  displayName: "MCP",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/mcp.png",
  authors: [],
  actions: [returnResponse],
  triggers: [mcpTool],
});
