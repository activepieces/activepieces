
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const medullarAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Please use **api-key** as value for API Key',
    });

    export const medullar = createPiece({
      displayName: "Medullar",
      auth: medullarAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/medullar.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    