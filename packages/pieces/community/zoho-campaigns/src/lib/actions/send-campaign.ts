import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsCampaignDropdown } from '../common/props';

export const sendCampaignAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'send_campaign',
    displayName: 'Send Campaign',
    description: 'Sends a campaign that has been created or cloned.',
    props: {
        campaign_key: zohoCampaignsCampaignDropdown,
    },
    async run({ auth, propsValue }) {
        
        const body = new URLSearchParams({
            resfmt: 'JSON',
            campaignkey: propsValue.campaign_key,
        });

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://campaigns.zoho.com/api/v1.1/sendcampaign',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        return response.body;
    },
});