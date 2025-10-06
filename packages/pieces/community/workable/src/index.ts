
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const workable = createPiece({
      displayName: "Workable",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/workable.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    