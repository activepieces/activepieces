
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const teamwork = createPiece({
      displayName: "Teamwork",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/teamwork.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    