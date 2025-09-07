import { createTrigger } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newCampaign = createTrigger({
    name: 'new_campaign',
    displayName: 'New Campaign',
    description: 'Triggers when a new campaign is created',
    props: {},
    sampleData: {
        "campaignKey": "123456",
        "campaignName": "Sample Campaign",
        "subject": "Welcome to our newsletter",
        "fromName": "Marketing Team",
        "fromEmail": "marketing@company.com",
        "status": "draft",
        "createdTime": "2023-09-07T10:00:00Z"
    },
    type: 'polling',
    async test(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: '/getcampaigns?resfmt=JSON&status=draft&fromIndex=0&range=10',
        });

        return response.data?.slice(0, 1) ?? [];
    },
    async run(context) {
        const lastCheck = await context.store.get('lastCheck') as string;
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: '/getcampaigns?resfmt=JSON&status=draft&fromIndex=0&range=10',
        });

        return response.data ?? [];
    },
    async onEnable(context) {
        // Store the current timestamp to use as a baseline for future checks
        context.store.put('lastCheck', new Date().toISOString());
    },
    async onDisable() {
        // Clean up if needed
    },
});
