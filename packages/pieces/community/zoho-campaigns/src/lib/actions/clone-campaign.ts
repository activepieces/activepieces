import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const cloneCampaign = createAction({
	name: 'clone_campaign',
	displayName: 'Clone Campaign',
	description:
		'Clone an existing campaign, optionally renaming and changing sender fields.',
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
		campaigninfo: Property.Object({
			displayName: 'Campaign Info',
			description:
				'JSON with campaignname, subject, from_name, from_add, reply_to, oldcampaignkey, encode_type',
			required: true,
		}),
		usePost: Property.Checkbox({
			displayName: 'Use POST',
			description: 'Send as POST instead of GET',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const location = ((auth as OAuth2PropertyValue).props && (auth as OAuth2PropertyValue).props!['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;

		const encodedCampaignInfo = encodeURIComponent(JSON.stringify(propsValue.campaigninfo));
		const resfmt = propsValue.resfmt;
		const url = `${baseUrl}/${resfmt.toLowerCase()}/clonecampaign?resfmt=${resfmt}&campaigninfo=${encodedCampaignInfo}`;

		const method = propsValue.usePost ? HttpMethod.POST : HttpMethod.GET;
		const response = await httpClient.sendRequest({
			method,
			url,
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
		});

		return response.body;
	},
});


