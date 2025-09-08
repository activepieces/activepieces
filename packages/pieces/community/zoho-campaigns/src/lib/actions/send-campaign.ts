import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const sendCampaign = createAction({
	name: 'send_campaign',
	displayName: 'Send Campaign',
	description: 'Send a campaign that has been created or cloned.',
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
		campaignkey: Property.ShortText({
			displayName: 'Campaign Key (manual)',
			description: 'Type a campaign key from create/clone response',
			required: false,
		}),
		campaignkey_dropdown: Property.Dropdown({
			displayName: 'Campaign Key',
			description: 'Pick from recent sent campaigns',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return { disabled: true, placeholder: 'Connect Zoho Campaigns first', options: [] };
				}
				const { access_token, props } = auth as OAuth2PropertyValue;
				const location = (props && props['location']) || 'zoho.com';
				const baseUrl = `https://campaigns.${location}/api/v1.1`;
				const resp = await httpClient.sendRequest({
					method: HttpMethod.GET,
					url: `${baseUrl}/recentsentcampaigns?resfmt=JSON`,
					headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
				});
				const items = Array.isArray(resp.body) ? resp.body : Object.values(resp.body ?? {}).find(Array.isArray) ?? [];
				return {
					disabled: false,
					options: (items as any[]).map((c) => ({
						label: c.campaign_name ?? c.email_subject ?? c.name ?? 'Unnamed campaign',
						value: c.campaign_key ?? c.campaignkey ?? c.campaignKey ?? c.key,
					})).filter(o => o.value),
				};
			},
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const location = ((auth as OAuth2PropertyValue).props && (auth as OAuth2PropertyValue).props!['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;

		const campaignKey = (propsValue.campaignkey_dropdown as string | undefined) || (propsValue.campaignkey as string | undefined);
		if (!campaignKey) {
			throw new Error('Provide a campaign key or select one from the dropdown');
		}

		const formParams: Record<string, string> = {
			resfmt: propsValue.resfmt,
			campaignkey: campaignKey,
		};
		const body = new URLSearchParams(formParams).toString();

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${baseUrl}/sendcampaign`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
			body,
		});

		return response.body;
	},
});


