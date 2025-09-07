import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendCampaign = createAction({
    name: 'send_campaign',
    displayName: 'Send Campaign',
    description: 'Send a campaign that has been created or cloned',
    props: {
        campaignKey: {
            type: 'string',
            displayName: 'Campaign Key',
            required: true,
        },
        scheduledTime: {
            type: 'string',
            displayName: 'Scheduled Time (optional, ISO format)',
            required: false,
        },
    },
    async run(context) {
        const body: Record<string, unknown> = {
            campaignKey: context.propsValue.campaignKey,
        };

        if (context.propsValue.scheduledTime) {
            body.scheduledTime = context.propsValue.scheduledTime;
        }

        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.POST,
            path: '/sendcampaign',
            body,
        });

        return response;
    },
});
