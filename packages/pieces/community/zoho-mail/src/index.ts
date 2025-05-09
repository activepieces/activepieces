
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const zohoMail = createPiece({
      displayName: "Zoho-mail",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/zoho-mail.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    