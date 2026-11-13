import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { campaignIdProp, emailsProp, leadIdsDropdownProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const addRecipientsAction = createAction({
  auth: hunterAuth,
  name: 'add-recipients',
  classification: 'WRITE',
  displayName: 'Add Recipients',
  description: 'Add one or more recipients to a campaign (sequence).',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds up to 50 emails and/or 50 existing leads as recipients of a Hunter campaign (sequence) picked from a dropdown. Hunter skips recipients already in the campaign and reports them in skipped_recipients, so a repeat call adds nothing new.',
    idempotent: false,
  },
  props: {
    campaign_id: campaignIdProp,
    emails: emailsProp,
    lead_ids: leadIdsDropdownProp,
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
