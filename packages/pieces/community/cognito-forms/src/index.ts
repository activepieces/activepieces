
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const cognitoForms = createPiece({
      displayName: "Cognito-forms",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/cognito-forms.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    