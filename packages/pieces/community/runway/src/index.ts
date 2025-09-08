
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const runway = createPiece({
      displayName: "Runway",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/runway.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    