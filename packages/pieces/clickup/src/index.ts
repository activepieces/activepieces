import { AuthProp, Piece } from "@activepieces/pieces-framework";

export const clickup = Piece.create({
    displayName: "Clickup",
    logoUrl: 'https://cdn.activepieces.com/pieces/clickup.png',
    authors: ['abuaboud', 'ShayPunter', 'kanarelo'],
    auth: AuthProp.OAuth2({
        description: "",
        authUrl: "https://app.clickup.com/api",
        tokenUrl: "https://app.clickup.com/api/v2/oauth/token",
        required: true,
        scope: []
    }),
});
