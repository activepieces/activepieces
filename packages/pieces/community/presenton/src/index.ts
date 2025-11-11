
import { createPiece } from "@activepieces/pieces-framework";
import { generatePresentations } from "./lib/actions/generate-presentations";

import { presentonAuth } from "./lib/common/auth";
import { PieceCategory } from "@activepieces/shared";

export const presentation = createPiece({
  displayName: "Presenton",
  description: "Generate AI-powered presentations using Presenton (https://presenton.ai). Supports templates, themes, images, synchronous and asynchronous generation, status polling, and export to PPTX/PDF.",
  auth: presentonAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/presenton.png",
  categories:[PieceCategory.ARTIFICIAL_INTELLIGENCE,PieceCategory.CONTENT_AND_FILES],
  authors: ['sanket-a11y'],
  actions: [generatePresentations],
  triggers: [],
});
