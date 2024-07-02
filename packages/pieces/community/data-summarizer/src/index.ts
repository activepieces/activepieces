
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const dataSummarizer = createPiece({
      displayName: "Data-summarizer",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/data-summarizer.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    