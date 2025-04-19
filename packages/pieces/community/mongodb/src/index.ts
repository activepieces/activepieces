
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const mongodb = createPiece({
      displayName: "Mongodb",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/mongodb.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    