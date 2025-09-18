
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const sitespeakai = createPiece({
      displayName: "Sitespeakai",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/sitespeakai.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    