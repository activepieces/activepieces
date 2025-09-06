
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const cody = createPiece({
      displayName: "Cody",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/cody.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    