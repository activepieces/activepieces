
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const systemeIo = createPiece({
      displayName: "Systeme-io",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/systeme-io.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    