import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getIntercomBaseUrl, INTERCOM_API_VERSION, isRecord, verifiedTlsDispatcher } from './common/client';

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
			await sendMeRequest({ token: auth.accessToken, region: auth.region, timeout: 15000 });
			return { valid: true };
		} catch (e) {
			const response = isRecord(e) ? e['response'] : undefined;
			const status = isRecord(response) ? response['status'] : undefined;
			if (status === 401 || status === 403) {
				return { valid: false, error: 'Invalid access token or wrong region. Check both and try again.' };
			}
			const detail = typeof status === 'number' ? `Intercom answered with HTTP ${status}.` : e instanceof Error ? e.message : String(e);
			return { valid: false, error: `Could not validate the connection. ${detail}` };
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
	try {
		const admin = await sendMeRequest({ token, region, timeout: 5000 });
		return admin.email || admin.name || admin.app?.name || undefined;
	} catch {
		return undefined;
	}
}

async function sendMeRequest({
	token,
	region,
	timeout,
}: {
	token: string;
	region: unknown;
	timeout: number;
}): Promise<IntercomAdmin> {
	const dispatcher = await verifiedTlsDispatcher();
	const response = await httpClient.sendRequest<IntercomAdmin>(
		{
			method: HttpMethod.GET,
			url: `${getIntercomBaseUrl(region)}/me`,
			headers: {
				Authorization: `Bearer ${token}`,
				'Intercom-Version': INTERCOM_API_VERSION,
				Accept: 'application/json',
			},
			timeout,
			followRedirects: false,
		},
		{ dispatcher },
	);
	return response.body;
}

type IntercomAdmin = { email?: string; name?: string; app?: { name?: string } };
