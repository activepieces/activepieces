import { createAction } from '@activepieces/pieces-framework'
import { zagomailAuth } from '../auth'
import { campaignUid } from '../common/props'
import { zagoMailApiService } from '../common/request'

export const getCampaignDetails = createAction({
    auth: zagomailAuth,
    name: 'getCampaignDetails',
    displayName: 'Get Campaign',
    description: 'Gets the details of a campaign.',
    props: {
        campaignUid: campaignUid,
    },
    async run({ propsValue, auth }) {
        const campaignUid = propsValue.campaignUid

        return await zagoMailApiService.getCampaignDetails(auth.secret_text, campaignUid)
    },
})
