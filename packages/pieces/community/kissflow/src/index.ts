
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const kissflow = createPiece({
      displayName: "Kissflow",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/kissflow.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    