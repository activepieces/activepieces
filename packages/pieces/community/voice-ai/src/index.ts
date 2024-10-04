
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const voiceAi = createPiece({
      displayName: "Voice-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/voice-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    