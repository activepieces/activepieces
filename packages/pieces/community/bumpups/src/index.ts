
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const bumpups = createPiece({
      displayName: "Bumpups",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/bumpups.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    