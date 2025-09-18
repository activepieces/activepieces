
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const emailoctopus = createPiece({
      displayName: "Emailoctopus",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/emailoctopus.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    