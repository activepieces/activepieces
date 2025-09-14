
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const insightoAi = createPiece({
      displayName: "Insighto-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/insighto-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    