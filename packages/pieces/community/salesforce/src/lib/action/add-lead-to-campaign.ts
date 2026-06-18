import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const addLeadToCampaign = createAction({
    auth: salesforceAuth,
    name: 'add_lead_to_campaign',
    displayName: 'Add Lead to Campaign',
    description: 'Adds an existing lead to an existing campaign.',
    audience: 'both',
    aiMetadata: { description: 'Link an existing Lead to an existing Campaign by creating a CampaignMember with the given member status. Use to enroll a known lead in a campaign. Not idempotent: re-running creates another CampaignMember, and Salesforce rejects a duplicate lead/campaign pairing with an error.', idempotent: false },
    props: {
        campaign_id: salesforcesCommon.campaign,
        lead_id: salesforcesCommon.lead,
        status: salesforcesCommon.status,
    },
    async run(context) {
        const { campaign_id, lead_id, status } = context.propsValue;

        const body = {
            CampaignId: campaign_id,
            LeadId: lead_id,
            Status: status,
        };

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            '/services/data/v56.0/sobjects/CampaignMember',
            body
        );

        return response.body;
    },
});
