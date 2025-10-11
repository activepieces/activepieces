import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const addContactToCampaign = createAction({
  auth: salesforceAuth,
  name: 'add_contact_to_campaign',
  displayName: 'Add Contact to Campaign',
  description: 'Adds an existing Contact to an existing Campaign in Salesforce',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to add to campaign',
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
    const { contactId, campaignId, status } = context.propsValue;

    const campaignMemberData: Record<string, unknown> = {
      ContactId: contactId,
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

