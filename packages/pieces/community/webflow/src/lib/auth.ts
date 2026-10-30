import { PieceAuth } from '@activepieces/pieces-framework';

export const webflowAuth = PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://webflow.com/oauth/authorize',
	tokenUrl: 'https://api.webflow.com/oauth/access_token',
	required: true,
	scope: ['webhooks:write', 'forms:read'],
});
