
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const videoAI = createPiece({
  displayName: "Video-ai",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/video-ai.png",
  authors: ['amrdb'],
  actions: [],
  triggers: [],
});
