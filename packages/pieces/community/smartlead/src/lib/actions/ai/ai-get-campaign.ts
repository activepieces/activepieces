import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiGetCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'ai_get_campaign',
  classification: 'READ',
  displayName: 'Get Campaign',
  description: 'Get one SmartLead campaign with its settings.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one SmartLead campaign by numeric campaign_id: name, status, schedule, tracking (track_settings lists what is NOT tracked), stop condition, follow-up percentage and sending options. Read-only.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.campaign,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.getCampaign({ apiKey: auth.secret_text, campaignId: propsValue.campaign_id });
  },
});
