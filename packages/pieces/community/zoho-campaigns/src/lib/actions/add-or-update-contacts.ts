import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const addOrUpdateContacts = createAction({
	name: 'add_or_update_contacts',
	displayName: 'Add/Update Contact(s)',
	description: 'Add new contacts or update existing contacts in a list (no confirmation).',
	props: {
		listkey: Property.ShortText({
			displayName: 'List Key',
			description: 'List key where contacts will be added/updated',
			required: true,
		}),
		resfmt: Property.StaticDropdown({
			displayName: 'Response Format',
			description: 'XML or JSON',
			required: true,
			defaultValue: 'JSON',
			options: { options: [
				{ label: 'JSON', value: 'JSON' },
				{ label: 'XML', value: 'XML' },
			] },
		}),
		emailids: Property.Array({
			displayName: 'Email IDs',
			description: 'Up to 10 email addresses to add/update (comma-separated when sent)',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const location = ((auth as OAuth2PropertyValue).props && (auth as OAuth2PropertyValue).props!['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;

		const emails = (propsValue.emailids as string[] | undefined) || [];
		if (!Array.isArray(emails) || emails.length === 0) {
			throw new Error('Provide at least one email address');
		}
		if (emails.length > 10) {
			throw new Error('Provide a maximum of 10 email addresses');
		}

		const formParams: Record<string, string> = {
			listkey: propsValue.listkey,
			resfmt: propsValue.resfmt,
			emailids: emails.join(','),
		};
		const body = new URLSearchParams(formParams).toString();

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${baseUrl}/addlistsubscribersinbulk`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
			body,
		});

		return response.body;
	},
});


