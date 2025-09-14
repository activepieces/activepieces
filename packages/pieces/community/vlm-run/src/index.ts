
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const vlmRun = createPiece({
      displayName: "Vlm-run",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/vlm-run.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    