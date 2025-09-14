
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const joggAi = createPiece({
      displayName: "Jogg-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/jogg-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    