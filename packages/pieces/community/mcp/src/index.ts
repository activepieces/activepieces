
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { returnResponse } from "./lib/actions/return-response";
import { mcpTool } from "./lib/triggers/mcp-tool";
import { PieceCategory } from "@activepieces/shared";


export const mcp = createPiece({
  displayName: "MCP",
  description: 'Run a flow in MCP',
  auth: PieceAuth.None(),
  // categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/mcp.png",
  authors: [],
  actions: [returnResponse],
  triggers: [mcpTool],
});
    
