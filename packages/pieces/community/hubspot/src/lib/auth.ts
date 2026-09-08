import { AppConnectionType, AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const hubspotAuth = [
	PieceAuth.OAuth2({
		authUrl: 'https://app.hubspot.com/oauth/authorize',
		tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
		required: true,
		scope: [
			'crm.lists.read',
			'crm.lists.write',
			'crm.objects.companies.read',
			'crm.objects.companies.write',
			'crm.objects.contacts.read',
			'crm.objects.contacts.write',
			'crm.objects.custom.read',
			'crm.objects.custom.write',
			'crm.objects.deals.read',
			'crm.objects.deals.write',
			'crm.objects.line_items.read',
			'crm.objects.owners.read',
			'crm.objects.leads.read',
			'crm.objects.leads.write',
			'crm.schemas.companies.read',
			'crm.schemas.contacts.read',
			'crm.schemas.custom.read',
			'crm.schemas.deals.read',
			'crm.schemas.line_items.read',
			'automation',
			'e-commerce',
			'tickets',
			'content',
			'settings.currencies.read',
			'settings.users.read',
			'settings.users.teams.read',
			'files',
			'forms',
			'scheduler.meetings.meeting-link.read'
			// 'business_units_view.read'
		],
	}),
	PieceAuth.CustomAuth({
		displayName: 'Private App Access Token',
		description: `In HubSpot, go to **Development > Legacy Apps** in the left sidebar, create (or open) a private app, and on the **Scopes** tab grant the scopes for the actions you plan to use. They group roughly as:
  - **Contacts, companies & deals** — \`crm.objects.contacts.read\`, \`crm.objects.contacts.write\`, \`crm.objects.companies.read\`, \`crm.objects.companies.write\`, \`crm.objects.deals.read\`, \`crm.objects.deals.write\`, \`crm.objects.line_items.read\`, \`crm.schemas.contacts.read\`, \`crm.schemas.companies.read\`, \`crm.schemas.deals.read\`, \`crm.schemas.line_items.read\`
  - **Lists & custom objects** — \`crm.lists.read\`, \`crm.lists.write\`, \`crm.objects.custom.read\`, \`crm.objects.custom.write\`, \`crm.schemas.custom.read\`
  - **Leads & owners** — \`crm.objects.leads.read\`, \`crm.objects.leads.write\`, \`crm.objects.owners.read\`
  - **Tickets & e-commerce** — \`tickets\`, \`e-commerce\`
  - **Content, files & forms** — \`content\`, \`files\`, \`forms\`
  - **Workflows & meeting links** — \`automation\`, \`scheduler.meetings.meeting-link.read\`
  - **Account settings** — \`settings.currencies.read\`, \`settings.users.read\`, \`settings.users.teams.read\`

Then copy the **Access Token** from the **Auth** tab and paste it below. Private app tokens never expire.`,
		required: true,
		props: {
			access_token: PieceAuth.SecretText({
				displayName: 'Private App Access Token',
				description: 'The access token generated for your HubSpot private app.',
				required: true,
			}),
		},
		validate: async ({ auth }) => {
			try {
				await httpClient.sendRequest({
					method: HttpMethod.GET,
					url: 'https://api.hubapi.com/account-info/v3/details',
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: auth.access_token,
					},
				});
				return { valid: true };
			} catch {
				return { valid: false, error: 'Invalid Private App Access Token.' };
			}
		},
	}),
];

export type HubspotAuthValue = AppConnectionValueForAuthProperty<typeof hubspotAuth>;

export const getHubspotAccessToken = (auth: HubspotAuthValue): string =>
	auth.type === AppConnectionType.CUSTOM_AUTH ? auth.props.access_token:auth.access_token;
