
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { approveQuote } from "./lib/actions/approve-quote";
    import { settleQuote } from "./lib/actions/settle-quote";

    export const zroarb = createPiece({
      displayName: "Zroarb",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/zroarb.png",
      authors: [],
      actions: [approveQuote, settleQuote],
      triggers: [],
    });
    