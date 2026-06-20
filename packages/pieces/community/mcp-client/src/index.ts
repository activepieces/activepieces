import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { callToolAction } from "./lib/actions/call-tool";

export const mcpClient = createPiece({
  displayName: "MCP Client",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.83.0',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
  ],
  logoUrl: "https://cdn.activepieces.com/pieces/new-core/mcp.svg",
  authors: ['Angelebeats'],
  actions: [callToolAction],
  triggers: [],
});
