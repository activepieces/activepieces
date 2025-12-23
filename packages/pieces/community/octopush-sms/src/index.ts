
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const octopushSms = createPiece({
      displayName: "Octopush-sms",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/octopush-sms.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    