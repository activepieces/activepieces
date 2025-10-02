
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const insightly = createPiece({
      displayName: "Insightly",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/insightly.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    