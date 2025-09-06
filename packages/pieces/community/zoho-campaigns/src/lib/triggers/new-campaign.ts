import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';


type Campaign = {
    campaign_key: string;
    [key: string]: unknown;
};


interface GetRecentCampaignsResponse {
    recent_campaigns: Campaign[];
}

const triggerName = 'new_campaign_trigger';

export const newCampaign = createTrigger({
    auth: zohoCampaignsAuth,
    name: 'new_campaign',
    displayName: 'New Campaign',
    description: 'Fires when a new campaign is created.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
      "campaign_key": "f70c4878c4a47169407e63917ad24497",
      "campaign_name": "Summer Sale Newsletter",
      "created_date_string": "06 Sep 2025, 11:26 AM",
      "campaign_status": "Draft",
      "created_time": "1757248587000",
      "campaign_preview": "campaigns.zoho.com/EmailDisplayAction.do?&campaignId=303000023454038"
    },

    async onEnable(context) {
        const campaigns = await getRecentCampaigns(context.auth.access_token);
        
        const campaignKeys = campaigns.map(c => c.campaign_key);
        await context.store.put(triggerName, campaignKeys);
    },

    async onDisable(context) {
        await context.store.delete(triggerName);
    },

    async run(context) {
        const storedCampaignKeys = (await context.store.get<string[]>(triggerName)) ?? [];
        
        const currentCampaigns = await getRecentCampaigns(context.auth.access_token);
        const currentCampaignKeys = currentCampaigns.map(c => c.campaign_key);

        const newCampaigns: Campaign[] = [];
        for (const campaign of currentCampaigns) {
            if (!storedCampaignKeys.includes(campaign.campaign_key)) {
                newCampaigns.push(campaign);
            }
        }

        
        await context.store.put(triggerName, currentCampaignKeys);

        return newCampaigns;
    },
});


async function getRecentCampaigns(accessToken: string): Promise<Campaign[]> {
    const response = await httpClient.sendRequest<GetRecentCampaignsResponse>({
        method: HttpMethod.GET,
        url: 'https://campaigns.zoho.com/api/v1.1/recentcampaigns',
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        queryParams: {
            resfmt: 'JSON',
            sort: 'desc',
            status: 'all'
        },
    });

    return response.body.recent_campaigns || [];
}