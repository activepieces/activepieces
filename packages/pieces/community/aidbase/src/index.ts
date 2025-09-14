
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const aidbase = createPiece({
      displayName: "Aidbase",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/aidbase.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    