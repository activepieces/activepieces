import { AuthProp, Piece } from "@activepieces/pieces-framework";

export const asana = Piece.create({
    displayName: "Asana",
    logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
    authors: ['abuaboud'],
    auth: AuthProp.OAuth2({
        description: "",
        authUrl: "https://app.asana.com/-/oauth_authorize",
        tokenUrl: "https://app.asana.com/-/oauth_token",
        required: true,
        scope: ['default'],
    }),
});
