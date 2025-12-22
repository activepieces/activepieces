
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const clearoutphone = createPiece({
      displayName: "Clearoutphone",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/clearoutphone.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    