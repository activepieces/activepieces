
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const zagomail = createPiece({
      displayName: "Zagomail",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/zagomail.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    