
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const cloudconvert = createPiece({
      displayName: "Cloudconvert",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/cloudconvert.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    