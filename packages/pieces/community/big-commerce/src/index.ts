
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const bigCommerce = createPiece({
      displayName: "Big-commerce",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/big-commerce.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    