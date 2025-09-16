
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const gamma = createPiece({
      displayName: "Gamma",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/gamma.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    