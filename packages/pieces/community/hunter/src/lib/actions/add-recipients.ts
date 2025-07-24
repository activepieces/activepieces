import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';
import { campaignIdDropdown, leadIdDropdown } from '../common/props';

export const addRecipientsAction = createAction({
  auth: hunterIoAuth,
  name: 'add_recipients_to_campaign',
  displayName: 'Add Recipients to Campaign',
  description:
    'Add one or multiple recipients to a specific campaign by email or Lead ID.',
  props: {
    campaign_id: campaignIdDropdown,
    emails: Property.Array({
      displayName: 'Recipient Emails',
      description:
        'An array of recipient email addresses to add to the campaign. (Max 50)',
      required: false,
    }),
    lead_ids: Property.Array({
      displayName: 'Recipient Lead IDs',
      description:
        'An array of numeric Lead IDs to add to the campaign. (Max 50)',
      required: false
    }),
  },
  async run({ propsValue, auth }) {
    const { campaign_id, emails, lead_ids } = propsValue;

    if (
      (!emails || emails.length === 0) &&
      (!lead_ids || lead_ids.length === 0)
    ) {
      throw new Error(
        'You must provide at least one recipient email or one Lead ID.'
      );
    }
    const body: {
      emails?: string[];
      lead_ids?: number[];
    } = {};

    if (emails && emails.length > 0) {
      body.emails = emails.map(String);
    }

    if (lead_ids && lead_ids.length > 0) {
      body.lead_ids = lead_ids.map(Number);
    }

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: `/campaigns/${campaign_id}/recipients`,
        body,
      });

      return response;
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'A conflict occurred. This may be due to the state of the campaign or recipients.'
        );
      }
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request. Please check the Campaign ID, emails, or Lead IDs and try again.'
        );
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to add recipients: ${error.message}`);
    }
  },
});
