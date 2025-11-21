
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const appfollow = createPiece({
      displayName: "Appfollow",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/appfollow.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    