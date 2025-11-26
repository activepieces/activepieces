
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { documentAnalysisWithMineru } from "./lib/actions/document-analysis-with-mineru"

    export const mineru = createPiece({
      displayName: "MinerU",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://opendatalab.github.io/MinerU/images/logo.png",
      authors: ["Jean-Baptiste Pillot"],
      actions: [documentAnalysisWithMineru],
      triggers: [],
    });
    