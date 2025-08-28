
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const avoma = createPiece({
      displayName: "Avoma",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/avoma.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    