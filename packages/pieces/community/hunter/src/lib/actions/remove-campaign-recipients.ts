import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { aiProps } from '../common/ai-props';
import { apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const removeCampaignRecipientsAction = createAction({
  auth: hunterAuth,
  name: 'remove_campaign_recipients',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Campaign Recipients',
  description: 'Remove recipients from a campaign (sequence) and cancel their pending emails.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes up to 50 emails from a Hunter campaign (ID from List Campaigns). In a draft campaign they are removed; in a started one they are canceled along with their scheduled messages. Emails not in the campaign come back in skipped_recipients, so repeating the call changes nothing more.',
    idempotent: true,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    emails: Property.Array({ displayName: 'Emails', required: true, description: 'Recipient email addresses to remove (max 50).' }),
  },
  outputSchema: hunterOutputSchemas.recipientsRemoved,
  async run(context) {
    return hunterRequests.removeRecipients({ apiKey: apiKeyOf(context.auth), campaignId: context.propsValue.campaign_id, emails: context.propsValue.emails });
  },
});
