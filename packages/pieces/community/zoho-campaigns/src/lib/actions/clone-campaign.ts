import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsCampaignDropdown } from '../common/props';

export const cloneCampaignAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'clone_campaign',
    displayName: 'Clone Campaign',
    description: 'Clone an existing campaign, optionally renaming it.',
    props: {
        old_campaign_key: zohoCampaignsCampaignDropdown,
        campaign_name: Property.ShortText({
            displayName: 'New Campaign Name',
            description: 'A new name for the cloned campaign. If left blank, the original name will be used.',
            required: false,
        }),
        subject: Property.ShortText({
            displayName: 'New Subject',
            description: 'A new subject line for the cloned campaign.',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const campaignInfo: { [key: string]: unknown } = {
            oldcampaignkey: propsValue.old_campaign_key,
        };

        if (propsValue.campaign_name) {
            
            campaignInfo['campaignname'] = propsValue.campaign_name;
        }
        if (propsValue.subject) {
           
            campaignInfo['subject'] = propsValue.subject;
        }
        
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://campaigns.zoho.com/api/v1.1/json/clonecampaign',
            headers: {
                Authorization: `Zoho-oauthtoken ${auth.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
                campaigninfo: JSON.stringify(campaignInfo),
            },
        });

        return response.body;
    },
});