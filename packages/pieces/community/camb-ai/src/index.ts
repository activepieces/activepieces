
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const cambAi = createPiece({
      displayName: "Camb-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/camb-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    