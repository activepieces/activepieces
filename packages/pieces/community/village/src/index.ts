
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const villageAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your Village API Key',
    });
    
    
    export const village = createPiece({
      displayName: "Village",
      auth: villageAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/village.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    