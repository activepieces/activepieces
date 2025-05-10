
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const attio = createPiece({
      displayName: "Attio",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/attio.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    