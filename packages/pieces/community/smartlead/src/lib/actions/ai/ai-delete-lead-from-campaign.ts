import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiDeleteLeadFromCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'ai_delete_lead_from_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Lead from Campaign',
  description: 'Remove a lead from a SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one lead from a SmartLead campaign by numeric campaign_id and lead_id, dropping its progress in that campaign. Cannot be undone; to only stop emails use Update Lead Status in Campaign with pause or unsubscribe. Not idempotent: a second call fails because the lead is no longer in the campaign.',
    idempotent: false,
  },
  outputSchema: smartleadOutputSchemas.deleteLead,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
    lead_id: Property.Number({ displayName: 'Lead ID', description: 'Numeric SmartLead lead ID (from List Campaign Leads or Find Lead by Email).', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.deleteLeadFromCampaign({ apiKey: auth.secret_text, campaignId: propsValue.campaign_id, leadId: propsValue.lead_id });
  },
});
