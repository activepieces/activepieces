
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const intruder = createPiece({
      displayName: "Intruder",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/intruder.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    