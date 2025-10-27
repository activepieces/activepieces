
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const folk = createPiece({
      displayName: "Folk",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/folk.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    