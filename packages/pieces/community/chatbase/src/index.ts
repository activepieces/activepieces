
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const chatbase = createPiece({
      displayName: "Chatbase",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/chatbase.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    