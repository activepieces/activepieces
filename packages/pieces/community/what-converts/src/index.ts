
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const whatConverts = createPiece({
      displayName: "What-converts",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/what-converts.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    