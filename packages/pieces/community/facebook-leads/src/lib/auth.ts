import { PieceAuth } from '@activepieces/pieces-framework';

export const facebookLeadsAuth = PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://graph.facebook.com/oauth/authorize',
	tokenUrl: 'https://graph.facebook.com/oauth/access_token',
	required: true,
	scope: [
		'pages_show_list',
		'pages_manage_ads',
		'leads_retrieval',
		'pages_manage_metadata',
		'business_management',
	],
});
