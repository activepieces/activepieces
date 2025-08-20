
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { generateVideo } from "./lib/actions/generate-video";
import { PieceCategory } from "@activepieces/shared";

export const videoAI = createPiece({
  displayName: "Video-ai",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/video-ai.png",
  authors: ['amrdb'],
  actions: [generateVideo],
  triggers: [],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
});
