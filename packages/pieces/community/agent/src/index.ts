import { createPiece, PieceAuth } from "@ensemble/pieces-framework";
import { runAgent } from "./lib/actions/run-agent";
import { PieceCategory } from "@ensemble/shared";

export const agent = createPiece({
  displayName: "Agent",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.66.0',
  logoUrl: "https://cdn.ensemble.com/pieces/agent.png",
  authors: ['Gamal72', 'abuaboud'],
  description: "Let an AI assistant help you with tasks using tools.",
  actions: [runAgent],
  triggers: [],
  categories: [PieceCategory.UNIVERSAL_AI],
});
