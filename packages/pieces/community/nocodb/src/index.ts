
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const nocodb = createPiece({
      displayName: "Nocodb",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/nocodb.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    