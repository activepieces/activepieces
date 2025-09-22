
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const vadooAi = createPiece({
      displayName: "Vadoo-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/vadoo-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    