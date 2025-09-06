
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const lemlist = createPiece({
      displayName: "Lemlist",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/lemlist.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    