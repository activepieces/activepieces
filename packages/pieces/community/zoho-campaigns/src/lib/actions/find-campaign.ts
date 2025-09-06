import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsCampaignDropdown } from '../common/props';

export const findCampaignAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'find_campaign',
    displayName: 'Find Campaign',
    description: 'Finds an existing campaign and retrieves its details.',
    props: {
        campaign_key: zohoCampaignsCampaignDropdown,
        campaign_type: Property.StaticDropdown({
            displayName: 'Campaign Type',
            required: true,
            defaultValue: 'normal',
            options: {
                options: [
                    { label: 'Normal Campaign', value: 'normal' },
                    { label: 'A/B Test Campaign', value: 'abtesting' },
                ]
            }
        })
    },
    async run({ auth, propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://campaigns.zoho.com/api/v1.1/getcampaigndetails',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
                campaignkey: propsValue.campaign_key,
                campaigntype: propsValue.campaign_type,
            }
        });

        return response.body;
    },
});