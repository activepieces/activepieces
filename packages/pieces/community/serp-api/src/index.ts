
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const serpApi = createPiece({
      displayName: "Serp-api",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/serp-api.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    