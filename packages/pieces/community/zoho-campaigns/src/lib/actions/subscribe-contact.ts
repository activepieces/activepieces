import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const subscribeContact = createAction({
	name: 'subscribe_contact',
	displayName: 'Add Contact to Mailing List',
	description: 'Add contacts to your mailing lists (confirmation depends on list settings).',
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
		listkey: Property.ShortText({
			displayName: 'List Key',
			description: 'List key to subscribe the contact to',
			required: true,
		}),
		contactinfo: Property.Object({
			displayName: 'Contact Info',
			description: 'Contact details, e.g., { "Contact Email": "user@example.com" }',
			required: true,
		}),
		source: Property.ShortText({
			displayName: 'Source',
			description: 'Optional contact source',
			required: false,
		}),
		topic_id: Property.ShortText({
			displayName: 'Topic ID',
			description: 'Topic ID if topic-based subscription is needed',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const location = ((auth as OAuth2PropertyValue).props && (auth as OAuth2PropertyValue).props!['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;

		const resfmt = propsValue.resfmt as string;
		const encodedContactInfo = encodeURIComponent(JSON.stringify(propsValue.contactinfo));

		const formParams: Record<string, string> = {
			resfmt,
			listkey: propsValue.listkey,
			contactinfo: encodedContactInfo,
		};
		if (propsValue.source) formParams['source'] = propsValue.source;
		if (propsValue.topic_id) formParams['topic_id'] = propsValue.topic_id;

		const body = new URLSearchParams(formParams).toString();

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${baseUrl}/${resfmt.toLowerCase()}/listsubscribe`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
			body,
		});

		return response.body;
	},
});


