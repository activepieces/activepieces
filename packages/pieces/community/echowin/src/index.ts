
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const echowin = createPiece({
      displayName: "Echowin",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/echowin.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    