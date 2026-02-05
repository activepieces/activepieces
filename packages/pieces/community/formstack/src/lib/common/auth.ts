import { PieceAuth } from "@activepieces/pieces-framework";

export const formStackAuth = PieceAuth.OAuth2({
    description: 'Connect your Formstack account',
    authUrl: 'https://www.formstack.com/api/v2/oauth2/authorize',
    tokenUrl: 'https://www.formstack.com/api/v2/oauth2/token',
    required: true,
    scope: [],
});

