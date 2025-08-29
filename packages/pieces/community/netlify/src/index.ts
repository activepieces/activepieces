
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const netlify = createPiece({
      displayName: "Netlify",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/netlify.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    