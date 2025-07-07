import { PieceAuth } from "@activepieces/pieces-framework";

export const formStackAuth = PieceAuth.OAuth2({
    description: 'Authenticate with your Formstack account using OAuth2.',
    authUrl: 'https://www.formstack.com/api/v2/oauth2/authorize',
    tokenUrl: 'https://www.formstack.com/api/v2/oauth2/token',
    required: true,
    scope: [], // Formstack does not require a scope for basic OAuth2, leave empty or adjust if needed
});

