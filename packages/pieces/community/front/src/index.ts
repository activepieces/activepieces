
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const front = createPiece({
      displayName: "Front",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/front.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    