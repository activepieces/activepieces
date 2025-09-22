
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const prompthub = createPiece({
      displayName: "Prompthub",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/prompthub.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    