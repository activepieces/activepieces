
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { receiveDeposit } from "./lib/triggers/receive-deposit";
    
    export const travelex = createPiece({
      displayName: "Travelex",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/travelex.png",
      authors: [],
      actions: [],
      triggers: [receiveDeposit],
    });
    