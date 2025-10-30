
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const fathom = createPiece({
      displayName: "Fathom",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/fathom.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    