import { PieceAuth } from '@activepieces/pieces-framework';

export const pipedriveAuth = PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
	tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
	required: true,
	scope: [
		'base',
		'admin',
		'contacts:full',
		'users:read',
		'deals:full',
		'activities:full',
		'leads:full',
		'products:full',
		'webhooks:full'
	],
});
