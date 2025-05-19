
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const acuityScheduling = createPiece({
      displayName: "Acuity-scheduling",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/acuity-scheduling.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    