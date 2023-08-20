
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const googleSlides = createPiece({
  displayName: "Google-slides",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: "https://cdn.activepieces.com/pieces/google-slides.png",
  authors: [],
  actions: [],
  triggers: [],
});
