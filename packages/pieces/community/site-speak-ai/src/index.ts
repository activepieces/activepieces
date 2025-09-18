
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const siteSpeakAi = createPiece({
      displayName: "Site-speak-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/site-speak-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    