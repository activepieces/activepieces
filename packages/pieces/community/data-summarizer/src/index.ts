
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { countUniques } from "./lib/actions/count-uniques"
    
    export const dataSummarizer = createPiece({
      displayName: "Data Summarizer",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/data-summarizer.png",
      authors: [],
      actions: [countUniques],
      triggers: [],
    });
    