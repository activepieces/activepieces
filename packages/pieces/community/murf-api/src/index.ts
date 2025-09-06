
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const murfApi = createPiece({
      displayName: "Murf-api",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/murf-api.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    