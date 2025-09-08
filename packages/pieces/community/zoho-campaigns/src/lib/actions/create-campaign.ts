import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const createCampaign = createAction({
	name: 'create_campaign',
	displayName: 'Create Campaign',
	description:
		'Create a new campaign with name, subject, topic, sender address, and mailing list.',
	props: {
		resfmt: Property.StaticDropdown({
			displayName: 'Response Format',
			description: 'xml or json',
			required: true,
			defaultValue: 'json',
			options: { options: [
				{ label: 'JSON', value: 'json' },
				{ label: 'XML', value: 'xml' },
			] },
		}),
		campaignname: Property.ShortText({
			displayName: 'Campaign Name',
			description: 'A name for your campaign',
			required: true,
		}),
		from_email: Property.ShortText({
			displayName: 'From Email',
			description: 'Sender email address',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Subject line',
			required: true,
		}),
		content_url: Property.ShortText({
			displayName: 'Content URL',
			description: 'Public URL for the HTML content of the campaign',
			required: false,
		}),
		list_details: Property.LongText({
			displayName: 'List Details (JSON, UTF-8 encoded)',
			description:
				'{listkey:[segment_ID,...],listkey:...} - JSON to be URL-encoded before sending',
			required: true,
		}),
		topicId: Property.ShortText({
			displayName: 'Topic ID',
			description:
				'If topic management is enabled, provide topicId to target recipients by topic.',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const location = ((auth as OAuth2PropertyValue).props && (auth as OAuth2PropertyValue).props!['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;
		const formParams: Record<string, string> = {
			resfmt: propsValue.resfmt,
			campaignname: propsValue.campaignname,
			from_email: propsValue.from_email,
			subject: propsValue.subject,
		};

		if (propsValue.content_url) {
			formParams['content_url'] = propsValue.content_url;
		}
		if (propsValue.list_details) {
			formParams['list_details'] = propsValue.list_details;
		}
		if (propsValue.topicId) {
			formParams['topicId'] = propsValue.topicId;
		}

		const searchParams = new URLSearchParams(formParams);

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${baseUrl}/createCampaign`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
			body: searchParams.toString(),
		});

		return response.body;
	},
});


