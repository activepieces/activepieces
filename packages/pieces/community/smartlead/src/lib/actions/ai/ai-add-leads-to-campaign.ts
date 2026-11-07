import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiAddLeadsToCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'ai_add_leads_to_campaign',
  classification: 'WRITE',
  displayName: 'Add Leads to Campaign',
  description: 'Add up to 400 leads to a SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds 1-400 leads to a SmartLead campaign by numeric campaign_id. Each lead is an object with a required email and optional first_name, last_name, company_name, phone_number, website, location, linkedin_profile, company_url and custom_fields (object of string values). SmartLead skips leads already in the campaign and reports counts (upload_count, duplicate_count, invalid_email_count, block_count). The ignore_* flags bypass block, unsubscribe, cross-campaign duplicate and community bounce checks; leave them off unless asked. Not idempotent.',
    idempotent: false,
  },
  outputSchema: smartleadOutputSchemas.addLeads,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
    leads: Property.Array({
      displayName: 'Leads',
      required: true,
      properties: {
        email: Property.ShortText({ displayName: 'Email', required: true }),
        first_name: Property.ShortText({ displayName: 'First Name', required: false }),
        last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
        company_name: Property.ShortText({ displayName: 'Company Name', required: false }),
        phone_number: Property.ShortText({ displayName: 'Phone Number', required: false }),
        website: Property.ShortText({ displayName: 'Website', required: false }),
        location: Property.ShortText({ displayName: 'Location', required: false }),
        linkedin_profile: Property.ShortText({ displayName: 'LinkedIn Profile', required: false }),
        company_url: Property.ShortText({ displayName: 'Company URL', required: false }),
        custom_fields: Property.Json({ displayName: 'Custom Fields', description: 'Object of custom field name to value.', required: false }),
      },
    }),
    ignore_global_block_list: Property.Checkbox({ displayName: 'Ignore Global Block List', required: false }),
    ignore_unsubscribe_list: Property.Checkbox({ displayName: 'Ignore Unsubscribe List', required: false }),
    ignore_duplicate_leads_in_other_campaign: Property.Checkbox({ displayName: 'Ignore Duplicates in Other Campaigns', required: false }),
    ignore_community_bounce_list: Property.Checkbox({ displayName: 'Ignore Community Bounce List', required: false }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.addLeadsToCampaign({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaign_id,
      leadList: propsValue.leads,
      flags: {
        ignore_global_block_list: propsValue.ignore_global_block_list,
        ignore_unsubscribe_list: propsValue.ignore_unsubscribe_list,
        ignore_duplicate_leads_in_other_campaign: propsValue.ignore_duplicate_leads_in_other_campaign,
        ignore_community_bounce_list: propsValue.ignore_community_bounce_list,
      },
    });
  },
});
