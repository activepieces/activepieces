
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const PDF = createPiece({
      displayName: "Pdf",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/PDF.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    