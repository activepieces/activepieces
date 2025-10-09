import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const addLeadToCampaign = createAction({
  auth: salesforceAuth,
  name: 'add_lead_to_campaign',
  displayName: 'Add Lead to Campaign',
  description: 'Adds an existing Lead to an existing Campaign in Salesforce',
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'ID of the lead to add to campaign',
      required: true,
    }),
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'ID of the campaign',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Campaign member status (e.g., Sent, Responded)',
      required: false,
    }),
  },
  async run(context) {
    const { leadId, campaignId, status } = context.propsValue;

    const campaignMemberData: Record<string, unknown> = {
      LeadId: leadId,
      CampaignId: campaignId,
      ...(status && { Status: status }),
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/sobjects/CampaignMember',
      campaignMemberData
    );
    return response.body;
  },
});

