
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const googleSearchConsole = createPiece({
      displayName: "Google-search-console",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/google-search-console.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    