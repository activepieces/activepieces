
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const clicksend = createPiece({
      displayName: "Clicksend",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/clicksend.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    