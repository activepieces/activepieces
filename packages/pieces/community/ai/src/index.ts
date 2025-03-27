import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { returnAiResponse } from "./lib/actions/return-response";
import { PieceCategory } from "@activepieces/shared";
import { aiTrigger } from "./lib/triggers/ai-trigger";

export const ai = createPiece({
  displayName: "AI",
  description: "AI",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/ai.png',
  authors: [],
  actions: [returnAiResponse],
  triggers: [aiTrigger],
}); 
