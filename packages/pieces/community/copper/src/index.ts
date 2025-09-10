
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const copper = createPiece({
      displayName: "Copper",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/copper.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    