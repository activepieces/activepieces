import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';

const regionProp = Property.StaticDropdown({
	displayName: 'Region',
	required: true,
	options: {
		options: [
			{ label: 'US', value: 'intercom' },
			{ label: 'EU', value: 'eu.intercom' },
			{ label: 'AU', value: 'au.intercom' },
		],
	},
});

const oauth2Desc = `
Please follow the instructions to connect your Intercom account via OAuth2.

1. Log in to your Intercom account and navigate to **Settings > Integrations > Developer Hub**.
2. Click on **Create a new app** and select the appropriate workspace.
3. In the **Authentication** section, add the Redirect URL shown above to the allowed redirect URLs.
4. Go to the **Basic Information** section and copy the **Client ID** and **Client Secret**.
`;

export const intercomOAuth2Auth = PieceAuth.OAuth2({
	authUrl: 'https://app.{region}.com/oauth',
	tokenUrl: 'https://api.{region}.io/auth/eagle/token',
	required: true,
	description:oauth2Desc,
	scope: [],
	props: {
		region:regionProp
	},
	getConnectionIdentifier: async ({ auth }) =>
		fetchAdminLabel({ token: auth.access_token, region: auth.props?.['region'] }),
});


const intercomCustomAuth = PieceAuth.CustomAuth({
	displayName: 'Access Token',
	description: `Connect using an Intercom Access Token. You can find your token in **Settings > Integrations > Developer Hub > Your App > Authentication**.\nFor more information, please refer to [Access Token Authentication](https://developers.intercom.com/docs/build-an-integration/learn-more/authentication#how-to-get-your-access-token).`,
	required: true,
	props: {
		accessToken: PieceAuth.SecretText({
			displayName: 'Access Token',
			required: true,
		}),
		region: regionProp,
	},
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `https://api.${auth.region}.io/me`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.accessToken,
				},
			});
			return { valid: true };
		} catch (e) {
			return { valid: false, error: (e as Error).message };
		}
	},
	getConnectionIdentifier: async ({ auth }) =>
		fetchAdminLabel({ token: auth.accessToken, region: auth.region }),
});

export const intercomAuth = [intercomOAuth2Auth, intercomCustomAuth];

async function fetchAdminLabel({
	token,
	region,
}: {
	token: string;
	region: unknown;
}): Promise<string | undefined> {
	const host = typeof region === 'string' && region.length > 0 ? region : 'intercom';
	try {
		const response = await httpClient.sendRequest<IntercomAdmin>({
			method: HttpMethod.GET,
			url: `https://api.${host}.io/me`,
			headers: { Authorization: `Bearer ${token}` },
			timeout: 5000,
		});
		const admin = response.body;
		return admin.email || admin.name || admin.app?.name || undefined;
	} catch {
		return undefined;
	}
}

type IntercomAdmin = { email?: string; name?: string; app?: { name?: string } };
