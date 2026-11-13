import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations } from '../common/operations';
import { smartleadOutputSchemas } from '../common/output-schemas';
import { smartleadProps } from '../common/props';

export const updateLeadStatusInCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'update_lead_status_in_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Update Lead Status in Campaign',
  description: 'Pause, resume or unsubscribe a lead in a campaign.',
  audience: 'human',
  aiMetadata: {
    description:
      'Changes how a SmartLead campaign treats one lead, by numeric campaign_id and lead_id: pause stops sending to the lead for now, resume continues its sequence, unsubscribe permanently stops emailing it in this campaign. Find the lead id with Find Lead by Email or List Campaign Leads. Idempotent: repeating the same action leaves the lead in the same state.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.updateLeadStatus,
  props: {
    campaign_id: smartleadProps.campaignDropdown({
      description: 'The campaign the lead belongs to.',
    }),
    lead_id: Property.Number({
      displayName: 'Lead ID',
      description: 'Numeric SmartLead lead ID, e.g. from a previous step that found the lead by email.',
      required: true,
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      required: true,
      options: {
        options: [
          { label: 'Pause', value: 'pause' },
          { label: 'Resume', value: 'resume' },
          { label: 'Unsubscribe', value: 'unsubscribe' },
        ],
      },
    }),
  },
  async run(context) {
    return smartleadOperations.updateLeadStatusInCampaign({
      apiKey: context.auth.secret_text,
      campaignId: context.propsValue.campaign_id,
      leadId: context.propsValue.lead_id,
      action: context.propsValue.action,
    });
  },
});
