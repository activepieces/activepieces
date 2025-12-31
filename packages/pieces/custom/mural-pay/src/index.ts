
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { transferFiat } from "./lib/actions/transfer-fiat";

    export const muralPay = createPiece({
      displayName: "Mural-pay",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/mural-pay.png",
      authors: [],
      actions: [transferFiat],
      triggers: [],
    });
    