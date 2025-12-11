
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { getDocumentContent } from "./lib/actions/document-data-extraction-with-mineru"

    export const mineru = createPiece({
      displayName: "MinerU",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.73.0',
      logoUrl: "https://opendatalab.github.io/MinerU/images/logo.png",
      authors: ["Jean-Baptiste Pillot"],
      actions: [getDocumentContent],
      triggers: [],
    });
    
