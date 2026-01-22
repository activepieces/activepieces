import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const addContactToCampaign = createAction({
    auth: salesforceAuth,
    name: 'add_contact_to_campaign',
    displayName: 'Add Contact to Campaign',
    description: 'Add a contact to a campaign.',
    props: {
        campaign_id: salesforcesCommon.campaign,
        contact_id: salesforcesCommon.contact,
        status: salesforcesCommon.status,
    },
    async run(context) {
        const { campaign_id, contact_id, status } = context.propsValue;

        const body = {
            CampaignId: campaign_id,
            ContactId: contact_id,
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