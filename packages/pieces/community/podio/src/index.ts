
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const podio = createPiece({
      displayName: "Podio",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/podio.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    