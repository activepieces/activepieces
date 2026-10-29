import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiUpdateCampaignStatusAction = createAction({
  auth: smartleadAuth,
  name: 'ai_update_campaign_status',
  classification: 'DESTRUCTIVE',
  displayName: 'Update Campaign Status',
  description: 'Start, pause or stop a SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the status of a SmartLead campaign by numeric campaign_id. status is START (begins sending real emails to its leads), PAUSED (can be started again) or STOPPED (ends the campaign; cannot be restarted). Confirm with the user before START or STOPPED. Idempotent: repeating the same status leaves the campaign unchanged.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.updateCampaignStatus,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
    status: Property.ShortText({ displayName: 'Status', description: 'START, PAUSED or STOPPED.', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.updateCampaignStatus({ apiKey: auth.secret_text, campaignId: propsValue.campaign_id, status: propsValue.status.trim().toUpperCase() });
  },
});
