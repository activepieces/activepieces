import { PieceAuth } from '@activepieces/pieces-framework';

export const webflowAuth = PieceAuth.OAuth2({
	description:
		'Connect your Webflow account. On the Webflow consent screen, pick every site you want Activepieces to reach; sites you leave out stay invisible to every action and trigger. Connections made before the move to Webflow API v2 need to be reconnected.',
	authUrl: 'https://webflow.com/oauth/authorize',
	tokenUrl: 'https://api.webflow.com/oauth/access_token',
	required: true,
	scope: [
		'forms:read',
		'forms:write',
		'authorized_user:read',
		'sites:read',
		'sites:write',
		'cms:read',
		'cms:write',
		'pages:read',
		'pages:write',
		'components:read',
		'components:write',
		'custom_code:read',
		'custom_code:write',
		'assets:read',
		'assets:write',
		'comments:read',
		'comments:write',
		'ecommerce:read',
		'ecommerce:write',
	],
});
