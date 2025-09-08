
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { generateVideo } from "./lib/actions/generate-video";
import { PieceCategory } from "@activepieces/shared";

export const videoAI = createPiece({
  displayName: "Video AI",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.68.2',
  logoUrl: "https://cdn.activepieces.com/pieces/video-ai-piece.svg",
  authors: ['amrdb'],
  actions: [generateVideo],
  triggers: [],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
});
