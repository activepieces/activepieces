
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { convert } from "./lib/actions/convert";
    import { transfer } from "./lib/actions/transfer";

    export const circlePay = createPiece({
      displayName: "Circle-pay",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/circle-pay.png",
      authors: [],
      actions: [convert, transfer],
      triggers: [],
    });
    