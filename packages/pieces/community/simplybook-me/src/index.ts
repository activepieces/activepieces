
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const simplybookMe = createPiece({
      displayName: "Simplybook-me",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/simplybook-me.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    