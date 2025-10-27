
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const quickbase = createPiece({
      displayName: "Quickbase",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/quickbase.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    