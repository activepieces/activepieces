
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const capsuleCrm = createPiece({
      displayName: "Capsule-crm",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/capsule-crm.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    