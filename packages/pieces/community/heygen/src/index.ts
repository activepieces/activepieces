
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const heygen = createPiece({
      displayName: "Heygen",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/heygen.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    