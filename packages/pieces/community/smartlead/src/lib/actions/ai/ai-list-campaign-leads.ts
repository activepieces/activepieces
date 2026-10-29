import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiListCampaignLeadsAction = createAction({
  auth: smartleadAuth,
  name: 'ai_list_campaign_leads',
  classification: 'SEARCH',
  displayName: 'List Campaign Leads',
  description: 'List leads in a SmartLead campaign, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists leads in a SmartLead campaign by numeric campaign_id, with each lead id, email, name, company and its status in the campaign. Paginated: limit 1-100 (default 100), offset starts at 0; increase offset by limit while offset + limit < total_leads. Use the lead id with Get Lead Message History, Update Lead Status in Campaign or Delete Lead from Campaign. Read-only.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.listCampaignLeads,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
    offset: Property.Number({ displayName: 'Offset', description: 'Leads to skip. Default 0.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100. Default 100.', required: false }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.listCampaignLeads({ apiKey: auth.secret_text, campaignId: propsValue.campaign_id, offset: propsValue.offset, limit: propsValue.limit });
  },
});
