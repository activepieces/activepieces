import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { runAgent } from "./lib/actions/run-agent";
import { PieceCategory } from "@activepieces/shared";

export const agent = createPiece({
  displayName: "Agent",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.65.0',
  logoUrl: "https://cdn.activepieces.com/pieces/agent.png",
  authors: ['Gamal72', 'abuaboud'],
  description: "Let an AI assistant help you with tasks using tools.",
  actions: [runAgent],
  triggers: [],
  categories: [PieceCategory.UNIVERSAL_AI],
});
