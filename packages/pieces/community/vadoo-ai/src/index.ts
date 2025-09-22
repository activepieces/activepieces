import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { vadooAiAuth } from "./lib/common/auth";

export const vadooAi = createPiece({
  displayName: "Vadoo AI",
  auth: vadooAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/vadoo-ai.png",
  authors: [

  ],
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [

  ],
  triggers: [],
});