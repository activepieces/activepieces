import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiUpdateLeadStatusInCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'ai_update_lead_status_in_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Update Lead Status in Campaign',
  description: 'Pause, resume or unsubscribe a lead in a SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes how a SmartLead campaign treats one lead, by numeric campaign_id and lead_id. action is pause (stop sending to this lead for now), resume (continue the sequence) or unsubscribe (permanently stop emailing this lead in this campaign). Idempotent: repeating the same action leaves the lead in the same state.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.updateLeadStatus,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
    lead_id: Property.Number({ displayName: 'Lead ID', description: 'Numeric SmartLead lead ID (from List Campaign Leads or Find Lead by Email).', required: true }),
    action: Property.ShortText({ displayName: 'Action', description: 'pause, resume or unsubscribe.', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.updateLeadStatusInCampaign({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaign_id,
      leadId: propsValue.lead_id,
      action: propsValue.action.trim().toLowerCase(),
    });
  },
});
