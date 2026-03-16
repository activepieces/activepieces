// packages/pieces/community/canva/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
    authUrl: 'https://www.canva.com/api/oauth/authorize',
    tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
    required: true,
    // Minimum required scopes for a functional integration
    scope: [
        'design:content:read', 
        'design:meta:read', 
        'asset:read', 
        'asset:write',
        'folder:read',
        'folder:write'
    ],
});

export const canva = createPiece({
    displayName: 'Canva',
    auth: canvaAuth,
    minimumSupportedRelease: '0.20.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
    authors: [],
    actions: [
        // Ensure actions are imported and listed here
    ],
    triggers: [],
});
