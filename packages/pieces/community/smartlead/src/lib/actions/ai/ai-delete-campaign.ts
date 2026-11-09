import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiDeleteCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'ai_delete_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Campaign',
  description: 'Permanently delete a SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a SmartLead campaign by numeric campaign_id, including its sequences and lead associations. Cannot be undone; confirm with the user first. To only stop sending, use Update Campaign Status with PAUSED or STOPPED instead. Not idempotent: a second call fails because the campaign no longer exists.',
    idempotent: false,
  },
  outputSchema: smartleadOutputSchemas.deleteCampaign,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.deleteCampaign({ apiKey: auth.secret_text, campaignId: propsValue.campaign_id });
  },
});
