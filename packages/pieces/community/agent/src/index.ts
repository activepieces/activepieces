import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { runAgent } from "./lib/actions/run-agent";

export const agent = createPiece({
  displayName: "Agent",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/agent.png",
  authors: [],
  actions: [runAgent],
  triggers: [],
});
    