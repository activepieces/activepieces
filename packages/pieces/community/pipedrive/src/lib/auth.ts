import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

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
	getConnectionIdentifier: async ({ auth }) => {
		try {
			const response = await httpClient.sendRequest<{ data?: PipedriveUser }>({
				method: HttpMethod.GET,
				url: `${apiDomainOf(auth.data['api_domain'])}/api/v1/users/me`,
				headers: { Authorization: `Bearer ${auth.access_token}` },
				timeout: 5000,
			});
			const user = response.body?.data;
			return user?.email || user?.name || undefined;
		} catch {
			return undefined;
		}
	},
});

function apiDomainOf(apiDomain: unknown): string {
	return typeof apiDomain === 'string' && apiDomain.length > 0
		? apiDomain
		: 'https://api.pipedrive.com';
}

type PipedriveUser = { email?: string; name?: string };
