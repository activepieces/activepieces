
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const magicSlides = createPiece({
      displayName: "Magic-slides",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/magic-slides.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    