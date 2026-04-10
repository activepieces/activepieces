import { PieceAuth } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
    description: 'Authenticate your Canva account to connect with Activepieces.',
    authUrl: 'https://www.canva.com/oauth/authorize',
    tokenUrl: 'https://www.canva.com/oauth/token',
    required: true,
    scope: [
        'design:read',
        'design:write',
        'asset:read',
        'asset:upload', // Assuming specific upload scope
        'folder:read',
        'folder:write',
        'account:read', // Often useful for user info
    ],
});
