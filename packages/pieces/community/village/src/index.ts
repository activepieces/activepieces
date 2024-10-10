
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const village = createPiece({
      displayName: "Village",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/village.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    