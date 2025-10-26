
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { flowRunFailed } from "./lib/triggers/flow-run-failed";

    export const errorHandler = createPiece({
      displayName: "Error-handler",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/dust.png",
      authors: [],
      actions: [],
      triggers: [flowRunFailed],
    });
    