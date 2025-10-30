
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const meisterTask = createPiece({
      displayName: "Meister-task",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/meister-task.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    