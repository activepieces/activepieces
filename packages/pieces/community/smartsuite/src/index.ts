
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const smartsuite = createPiece({
      displayName: "Smartsuite",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/smartsuite.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    