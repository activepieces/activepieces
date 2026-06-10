import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartleadRequest } from '../common/client';
import { smartleadAuth } from '../auth';

export const addLeadsToCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'add_leads_to_campaign',
  displayName: 'Add Leads to Campaign',
  description:
    'Add one or more leads to a campaign with validation and deduplication. Maximum 400 leads per request.',
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
    const {
      campaign_id,
      lead_list,
      ignore_global_block_list,
      ignore_unsubscribe_list,
      ignore_duplicate_leads_in_other_campaign,
      ignore_community_bounce_list,
    } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const leads = typeof lead_list === 'string'
      ? JSON.parse(lead_list)
      : lead_list;

    if (!Array.isArray(leads)) {
      throw new Error(
        'lead_list must be a JSON array of lead objects with at least an "email" field'
      );
    }

    if (leads.length === 0) {
      throw new Error(
        'lead_list must contain at least one lead.'
      );
    }

    if (leads.length > 400) {
      throw new Error(
        `Maximum 400 leads per request. Got ${leads.length}. Split into multiple requests.`
      );
    }

    for (let i = 0; i < leads.length; i++) {
      if (!leads[i].email || typeof leads[i].email !== 'string') {
        throw new Error(
          `Lead at index ${i} is missing a required "email" field.`
        );
      }
    }

    const body: Record<string, unknown> = {
      lead_list: leads,
    };

    const settings: Record<string, boolean> = {};
    if (ignore_global_block_list) settings['ignore_global_block_list'] = true;
    if (ignore_unsubscribe_list) settings['ignore_unsubscribe_list'] = true;
    if (ignore_duplicate_leads_in_other_campaign)
      settings['ignore_duplicate_leads_in_other_campaign'] = true;
    if (ignore_community_bounce_list)
      settings['ignore_community_bounce_list'] = true;

    if (Object.keys(settings).length > 0) {
      body['settings'] = settings;
    }

    return await smartleadRequest({
      endpoint: `campaigns/${campaign_id}/leads`,
      method: HttpMethod.POST,
      apiKey,
      body,
    });
  },
});
