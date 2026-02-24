import { PieceAuth } from '@activepieces/pieces-framework';

export const ticktickAuth = PieceAuth.OAuth2({
	authUrl: 'https://ticktick.com/oauth/authorize',
	tokenUrl: 'https://ticktick.com/oauth/token',
	required: true,
	scope: ['tasks:read', 'tasks:write'],
});
