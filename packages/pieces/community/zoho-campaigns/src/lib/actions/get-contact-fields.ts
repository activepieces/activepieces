import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const findContact = createAction({
	name: 'find_contact',
	displayName: 'Find Contact',
	description: 'Look up an existing contact by email address.',
	props: {
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'xml or json',
			required: true,
			defaultValue: 'json',
			options: { options: [
				{ label: 'JSON', value: 'json' },
				{ label: 'XML', value: 'xml' },
			] },
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { access_token, props } = auth as OAuth2PropertyValue;
		const location = (props && props['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;

		const typeParam = propsValue.type as string;

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${baseUrl}/contact/allfields`,
			queryParams: { type: typeParam },
			headers: {
				Authorization: `Zoho-oauthtoken ${access_token}`,
			},
		});

		return response.body;
	},
});


