
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const slidespeak = createPiece({
      displayName: "Slidespeak",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/slidespeak.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    