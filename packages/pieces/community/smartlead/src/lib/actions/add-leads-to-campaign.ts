import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations } from '../common/operations';
import { smartleadOutputSchemas } from '../common/output-schemas';

export const addLeadsToCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'add_leads_to_campaign',
  classification: 'WRITE',
  displayName: 'Add Leads to Campaign',
  description:
    'Add one or more leads to a campaign with validation and deduplication. Maximum 400 leads per request.',
  audience: 'human',
  outputSchema: smartleadOutputSchemas.addLeads,
  props: {
    campaign_id: Property.Number({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to add leads to',
      required: true,
    }),
    lead_list: Property.Json({
      displayName: 'Lead List',
      description: `Array of lead objects. Each lead must have an "email" field. Optional fields: first_name, last_name, phone_number, company_name, website, location, linkedin_profile, company_url, custom_fields (object).

Example:
\`\`\`json
[
  {
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company_name": "Acme Corp",
    "custom_fields": { "job_title": "CEO" }
  }
]
\`\`\``,
      required: true,
    }),
    ignore_global_block_list: Property.Checkbox({
      displayName: 'Ignore Global Block List',
      description: 'Skip global block list validation',
      required: false,
      defaultValue: false,
    }),
    ignore_unsubscribe_list: Property.Checkbox({
      displayName: 'Ignore Unsubscribe List',
      description: 'Include previously unsubscribed leads',
      required: false,
      defaultValue: false,
    }),
    ignore_duplicate_leads_in_other_campaign: Property.Checkbox({
      displayName: 'Ignore Duplicates in Other Campaigns',
      description: 'Allow the same lead in multiple campaigns',
      required: false,
      defaultValue: false,
    }),
    ignore_community_bounce_list: Property.Checkbox({
      displayName: 'Ignore Community Bounce List',
      description: 'Skip community bounce list check',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return smartleadOperations.addLeadsToCampaign({
      apiKey: context.auth.secret_text,
      campaignId: p.campaign_id,
      leadList: p.lead_list,
      flags: {
        ignore_global_block_list: p.ignore_global_block_list,
        ignore_unsubscribe_list: p.ignore_unsubscribe_list,
        ignore_duplicate_leads_in_other_campaign: p.ignore_duplicate_leads_in_other_campaign,
        ignore_community_bounce_list: p.ignore_community_bounce_list,
      },
    });
  },
});
