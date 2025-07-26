import {
  createAction,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterAuth } from '../common/auth';
import { hunterApiCall } from '../common/client';
import { validateCampaignId, parseCommaSeparatedEmails, parseCommaSeparatedNumbers } from '../common/props';

export const addRecipientsAction = createAction({
  name: 'add_recipients',
  auth: hunterAuth,
  displayName: 'Add Recipients',
  description: 'Add one or multiple recipients to a campaign. WARNING: For active campaigns, emails might be sent immediately after adding recipients.',
  props: {
    campaign_id: Property.Number({
      displayName: 'Campaign ID',
      description: 'The identifier of the campaign to add recipients to',
      required: true,
    }),
    emails: Property.LongText({
      displayName: 'Email Addresses',
      description: 'Email addresses to add (one per line or comma-separated). Can be a single email or up to 50 emails. If validation fails for any email, no recipients will be added.',
      required: false,
    }),
    lead_ids: Property.LongText({
      displayName: 'Lead IDs',
      description: 'Lead IDs to add (one per line or comma-separated). Up to 50 lead IDs. If any lead cannot be found, no recipients will be added.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { campaign_id, emails, lead_ids } = propsValue;

    validateCampaignId(campaign_id);

    if (!emails && !lead_ids) {
      throw new Error('You must provide at least email addresses or lead IDs (or both)');
    }

    const body: Record<string, any> = {};

    if (emails && emails.trim()) {
      const emailList = parseCommaSeparatedEmails(emails, 50);
      body['emails'] = emailList.length === 1 ? emailList[0] : emailList;
    }

    if (lead_ids && lead_ids.trim()) {
      const leadIdList = parseCommaSeparatedNumbers(lead_ids, 'lead IDs', 50);
      body['lead_ids'] = leadIdList;
    }

    try {
      const response = await hunterApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: `/campaigns/${campaign_id}/recipients`,
        body,
      });

      return response;

    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error('Bad request: Please check your input parameters. All emails must be valid before any can be added.');
      }

      if (error.message.includes('422')) {
        throw new Error('Validation failed: Please check that all emails are valid and all lead IDs exist.');
      }

      if (error.message.includes('404')) {
        throw new Error('Campaign not found. Please check the campaign ID.');
      }

      throw new Error(`Failed to add recipients: ${error.message}`);
    }
  },
}); 