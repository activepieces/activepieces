import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../../auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { hunterOutputSchemas } from '../../common/output-schemas';
import { hunterRequests } from '../../common/requests';

export const addCampaignRecipientsByIdAction = createAction({
  auth: hunterAuth,
  name: 'add_campaign_recipients_by_id',
  classification: 'WRITE',
  displayName: 'Add Campaign Recipients by ID',
  description: 'Add emails or leads to a campaign (sequence) by campaign ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds up to 50 emails and/or 50 numeric lead IDs (from Search Leads) as recipients of a Hunter campaign (ID from List Campaigns). Recipients already in the campaign, invalid, bounced or unsubscribed come back in skipped_recipients with a reason, so a repeat call adds nothing new. A started campaign emails new recipients automatically.',
    idempotent: false,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    emails: Property.Array({ displayName: 'Emails', required: false, description: 'Email addresses to add (max 50).' }),
    lead_ids: Property.Array({ displayName: 'Lead IDs', required: false, description: 'Numeric lead IDs to add (max 50).' }),
  },
  outputSchema: hunterOutputSchemas.recipientsAdded,
  async run(context) {
    return hunterRequests.addRecipients({
      apiKey: apiKeyOf(context.auth),
      campaignId: context.propsValue.campaign_id,
      emails: context.propsValue.emails,
      leadIds: context.propsValue.lead_ids,
    });
  },
});
