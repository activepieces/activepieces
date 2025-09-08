import { OAuth2PropertyValue, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const findCampaign = createAction({
	name: 'find_campaign',
	displayName: 'Find Campaign',
	description: 'Locate an existing campaign by name or key and return its details.',
	props: {
		resfmt: Property.StaticDropdown({
			displayName: 'Response Format',
			description: 'XML or JSON',
			required: false,
			defaultValue: 'JSON',
			options: { options: [
				{ label: 'JSON', value: 'JSON' },
				{ label: 'XML', value: 'XML' },
			] },
		}),
		campaignkey: Property.Dropdown({
            displayName: 'Campaign Key',
            description: 'Pick from recent sent campaigns',
            required: true,
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
        })
	},
	async run(context) {
		const { auth, propsValue } = context;
		const accessToken = (auth as OAuth2PropertyValue).access_token;
		const location = ((auth as OAuth2PropertyValue).props && (auth as OAuth2PropertyValue).props!['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;
		const resfmt = propsValue.resfmt as string;
		const campaignKey: string = propsValue.campaignkey as string;

		const params = new URLSearchParams({
			resfmt,
			campaignkey: campaignKey,
		});

		const detailsResp = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${baseUrl}/getcampaigndetails?${params.toString()}`,
			headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
		});

		return detailsResp.body;
	},
});


