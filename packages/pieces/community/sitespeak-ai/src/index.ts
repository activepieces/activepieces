
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const sitespeakAi = createPiece({
      displayName: "Sitespeak-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/sitespeak-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    