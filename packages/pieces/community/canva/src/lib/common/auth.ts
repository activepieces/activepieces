import { PieceAuth } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
    required: true,
    authUrl: 'https://www.canva.com/oauth/authorize',
    tokenUrl: 'https://www.canva.com/oauth/token',
    scope: [],
});
