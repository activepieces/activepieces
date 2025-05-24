
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const pcloud = createPiece({
      displayName: "Pcloud",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/pcloud.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    