
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const softr = createPiece({
      displayName: "Softr",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/softr.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    