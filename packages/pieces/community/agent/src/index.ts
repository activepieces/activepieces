import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { OpenAIAgent } from "./lib/actions/openai-agent";

export const agent = createPiece({
  displayName: "Agent",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/agent.png",
  authors: [],
  actions: [OpenAIAgent],
  triggers: [],
});
    