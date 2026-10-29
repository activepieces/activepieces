import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiGetLeadMessageHistoryAction = createAction({
  auth: smartleadAuth,
  name: 'ai_get_lead_message_history',
  classification: 'READ',
  displayName: 'Get Lead Message History',
  description: 'Get the emails sent to and received from a lead in a campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the email thread between a SmartLead campaign and one lead, by numeric campaign_id and lead_id: each message has type (SENT or REPLY), time, from, to, subject and HTML body. Use it to read a lead reply. Read-only.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.messageHistory,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
    lead_id: Property.Number({ displayName: 'Lead ID', description: 'Numeric SmartLead lead ID (from List Campaign Leads or Find Lead by Email).', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.getLeadMessageHistory({ apiKey: auth.secret_text, campaignId: propsValue.campaign_id, leadId: propsValue.lead_id });
  },
});
