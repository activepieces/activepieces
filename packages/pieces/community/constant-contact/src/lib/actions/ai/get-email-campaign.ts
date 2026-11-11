import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { campaignOutputSchema } from '../../common/output-schemas';

export const getEmailCampaignAiAction = createAction({
  auth: constantContactAuth,
  name: 'get_email_campaign_ai',
  classification: 'READ',
  displayName: 'Get Email Campaign',
  description: 'Gets one email campaign and its activity IDs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets one Constant Contact email campaign by campaign_id, including campaign_activities (the primary_email activity ID is needed by Send Test Email). current_status casing differs between list and get (Draft vs DRAFT), so compare it case-insensitively. Needs the campaign_data permission.',
    idempotent: true,
  },
  outputSchema: campaignOutputSchema,
  props: {
    campaign_id: aiProps.text({ displayName: 'Campaign ID', description: 'The campaign_id (UUID).', required: true }),
  },
  async run({ auth, propsValue }) {
    const [campaignId] = ccInput.idList({ value: propsValue.campaign_id, label: 'Campaign ID', max: 1, required: true });
    const response = await ccClient.request({
      accessToken: auth.access_token,
      method: 'GET',
      path: `/emails/${ccClient.segment(campaignId)}`,
      operation: 'get email campaign',
      requiredScope: 'campaign_data',
    });
    return response.body;
  },
});
