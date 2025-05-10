
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const clockify = createPiece({
      displayName: "Clockify",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/clockify.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    