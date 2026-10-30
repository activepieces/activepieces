import { PieceAuth } from '@activepieces/pieces-framework';

import { facebookLeadsApi } from './common/api';

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
	getConnectionIdentifier: async ({ auth }) => {
		try {
			const me = await facebookLeadsApi.getMe({ accessToken: auth.access_token, timeout: 5000 });
			return me.name || undefined;
		} catch {
			return undefined;
		}
	},
});
