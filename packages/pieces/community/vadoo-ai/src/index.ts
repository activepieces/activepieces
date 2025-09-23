import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { vadooAiAuth } from "./lib/common/auth";
import { generateAiCaptions } from "./lib/actions/generate-ai-captions";
import { generateAiImage } from "./lib/actions/generate-ai-image";
import { generatePodcast } from "./lib/actions/generate-podcast";   
import { generateVideo } from "./lib/actions/generate-video";

export const vadooAi = createPiece({
  displayName: "Vadoo AI",
  auth: vadooAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/vadoo-ai.png",
  authors: [
  ],
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    generateVideo,
    generatePodcast,
    generateAiCaptions,
    generateAiImage,
  ],
  triggers: [],
});