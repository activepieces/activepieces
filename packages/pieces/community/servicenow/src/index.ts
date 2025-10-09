
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const servicenow = createPiece({
      displayName: "Servicenow",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/servicenow.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    