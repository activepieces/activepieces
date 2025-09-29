
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const parseur = createPiece({
      displayName: "Parseur",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/parseur.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    