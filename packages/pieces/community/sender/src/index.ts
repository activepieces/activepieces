
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const sender = createPiece({
      displayName: "Sender",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/sender.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    