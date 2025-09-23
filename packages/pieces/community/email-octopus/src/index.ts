
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const emailOctopus = createPiece({
      displayName: "Email-octopus",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/email-octopus.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    