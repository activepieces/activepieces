
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const productboard = createPiece({
      displayName: "Productboard",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/productboard.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    