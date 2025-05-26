
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const circleso = createPiece({
      displayName: "Circleso",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/circleso.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    