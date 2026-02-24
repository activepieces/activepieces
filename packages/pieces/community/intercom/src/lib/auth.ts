import { PieceAuth, Property } from '@activepieces/pieces-framework';

const description = `
Please follow the instructions to create Intercom Oauth2 app.

1.Log in to your Intercom account and navigate to **Settings > Integrations > Developer Hub**.
2.Click on **Create a new app** and select the appropriate workspace.
3.In **Authentication** section, add Redirect URL.
4.In **Webhooks** section, select the events you want to receive.
5.Go to the **Basic Information** section and copy the Client ID and Client Secret.
`;

export const intercomAuth = PieceAuth.OAuth2({
	authUrl: 'https://app.{region}.com/oauth',
	tokenUrl: 'https://api.{region}.io/auth/eagle/token',
	required: true,
	description,
	scope: [],
	props: {
		region: Property.StaticDropdown({
			displayName: 'Region',
			required: true,
			options: {
				options: [
					{ label: 'US', value: 'intercom' },
					{ label: 'EU', value: 'eu.intercom' },
					{ label: 'AU', value: 'au.intercom' },
				],
			},
		}),
	},
});
