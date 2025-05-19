
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const exa = createPiece({
      displayName: "Exa",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/exa.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    