
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const callbeast = createPiece({
      displayName: "Callbeast",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://callbeast.com/logo.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    