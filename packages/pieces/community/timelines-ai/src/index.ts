
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const timelinesAi = createPiece({
      displayName: "Timelines-ai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/timelines-ai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    