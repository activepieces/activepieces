import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { gammaAuth } from "./lib/common/auth";
import { generateGamma } from "./lib/actions/generate-gamma";
import { getGeneration } from "./lib/actions/get-generation";

export const gamma = createPiece({
  displayName: "Gamma",
  auth: gammaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/gamma.png",
  authors: [
  ],
  categories: [
    PieceCategory.CONTENT_AND_FILES, 
    PieceCategory.ARTIFICIAL_INTELLIGENCE
  ],
  actions: [
    generateGamma,
    getGeneration
  ],
  triggers: [],
});