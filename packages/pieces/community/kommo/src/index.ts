
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const kommo = createPiece({
      displayName: "Kommo",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/kommo.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    