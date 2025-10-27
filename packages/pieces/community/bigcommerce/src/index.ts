
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const bigcommerce = createPiece({
      displayName: "Bigcommerce",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/bigcommerce.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    