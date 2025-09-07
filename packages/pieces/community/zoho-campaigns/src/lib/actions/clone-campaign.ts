import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const cloneCampaign = createAction({
    name: 'clone_campaign',
    displayName: 'Clone Campaign',
    description: 'Clone an existing campaign, optionally renaming',
    props: {
        campaignKey: {
            type: 'string',
            displayName: 'Campaign Key',
            required: true,
        },
        newCampaignName: {
            type: 'string',
            displayName: 'New Campaign Name',
            required: true,
        },
    },
    async run(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.POST,
            path: '/clonecampaign',
            body: {
                campaignKey: context.propsValue.campaignKey,
                campaignName: context.propsValue.newCampaignName,
            },
        });

        return response;
    },
});
