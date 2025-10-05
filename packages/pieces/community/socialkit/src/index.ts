
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const socialkit = createPiece({
      displayName: "Socialkit",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/socialkit.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    