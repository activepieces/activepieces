import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations } from '../common/operations';
import { smartleadOutputSchemas } from '../common/output-schemas';
import { smartleadProps } from '../common/props';

export const updateCampaignStatusAction = createAction({
  auth: smartleadAuth,
  name: 'update_campaign_status',
  classification: 'DESTRUCTIVE',
  displayName: 'Update Campaign Status',
  description: 'Start, pause or stop a campaign. Starting sends real emails to its leads; a stopped campaign cannot be restarted.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sets the status of a SmartLead campaign by numeric campaign_id: START begins sending real emails to its leads, PAUSED halts sending and can be started again, STOPPED ends the campaign permanently. Confirm with the user before START or STOPPED. Idempotent: repeating the same status leaves the campaign unchanged.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.updateCampaignStatus,
  props: {
    campaign_id: smartleadProps.campaignDropdown({
      description: 'The campaign to update.',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        options: [
          { label: 'Start', value: 'START' },
          { label: 'Pause', value: 'PAUSED' },
          { label: 'Stop', value: 'STOPPED' },
        ],
      },
    }),
  },
  async run(context) {
    return smartleadOperations.updateCampaignStatus({
      apiKey: context.auth.secret_text,
      campaignId: context.propsValue.campaign_id,
      status: context.propsValue.status,
    });
  },
});
