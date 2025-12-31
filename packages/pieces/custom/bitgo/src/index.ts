
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { getStatement } from "./lib/triggers/get-statement";

    export const bitgoAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your Bitgo API Key',
    });

    export const bitgo = createPiece({
      displayName: "Bitgo",
      auth: bitgoAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/bitgo.png",
      authors: [],
      actions: [],
      triggers: [getStatement],
    });
    