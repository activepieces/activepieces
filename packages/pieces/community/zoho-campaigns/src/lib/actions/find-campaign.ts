import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCampaign = createAction({
    name: 'find_campaign',
    displayName: 'Find Campaign',
    description: 'Locate an existing campaign by campaign name',
    props: {
        campaignName: {
            type: 'string',
            displayName: 'Campaign Name',
            required: true,
        },
    },
    async run(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: `/getcampaigns?resfmt=JSON&campaignName=${encodeURIComponent(context.propsValue.campaignName)}`,
        });

        return response;
    },
});
