import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const addTagToContact = createAction({
	name: 'add_tag_to_contact',
	displayName: 'Add Tag to Contact',
	description: 'Apply a tag to a contact by email.',
	props: {
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
		tagName: Property.ShortText({
			displayName: 'Tag Name',
			description: 'Name of the tag to associate',
			required: true,
		}),
		lead_email: Property.ShortText({
			displayName: 'Lead Email',
			description: 'Email address of the contact',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const location = ((auth as OAuth2PropertyValue).props && (auth as OAuth2PropertyValue).props!['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;

		const params = new URLSearchParams({
			resfmt: propsValue.resfmt,
			tagName: propsValue.tagName,
			lead_email: propsValue.lead_email,
		});

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${baseUrl}/tag/associate?${params.toString()}`,
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
		});

		return response.body;
	},
});


