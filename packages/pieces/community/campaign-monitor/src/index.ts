
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const campaignMonitor = createPiece({
      displayName: "Campaign-monitor",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/campaign-monitor.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    