import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { ZohoCrmError, optionalId, parseJsonObject, requireId } from '../common/client';
import { convertFieldValue } from '../common/fields';
import { recordDropdown, userDropdown } from '../common/props';
import { convertLead } from '../common/records';
import { convertLeadOutputSchema } from '../output-schemas';

export const convertLeadAction = createAction({
  auth: zohoCrmAuth,
  name: 'convert_lead',
  classification: 'WRITE',
  displayName: 'Convert Lead',
  description: 'Converts a lead into a contact and account, and optionally a deal.',
  audience: 'human',
  aiMetadata: {
    description:
      'Converts one Zoho CRM lead into a contact plus an account (or links it to existing ones) and can create a deal in the same call. Use when a qualified lead should become a customer record. Not idempotent: a lead can be converted only once and a second call fails with ID_ALREADY_CONVERTED.',
    idempotent: false,
  },
  props: {
    lead_id: recordDropdown({ displayName: 'Lead', fixedModule: 'Leads' }),
    account_id: recordDropdown({
      displayName: 'Existing Account',
      description: 'Link to this account; the lead\'s Company must match its name.',
      fixedModule: 'Accounts',
      required: false,
    }),
    contact_id: recordDropdown({
      displayName: 'Existing Contact',
      description: 'Merge into this contact; the lead\'s name and email must match.',
      fixedModule: 'Contacts',
      required: false,
    }),
    overwrite: Property.Checkbox({ displayName: 'Overwrite Contact\'s Account', description: 'Move the existing contact to the given account.', required: false, defaultValue: false }),
    assign_to: userDropdown({
      displayName: 'Owner',
      description: 'Active user who owns the new records; empty keeps the lead owner.',
    }),
    notify_lead_owner: Property.Checkbox({ displayName: 'Notify Lead Owner', required: false, defaultValue: false }),
    notify_new_entity_owner: Property.Checkbox({ displayName: 'Notify New Owner', required: false, defaultValue: false }),
    create_deal: Property.Checkbox({ displayName: 'Create a Deal', required: false, defaultValue: false }),
    deal_name: Property.ShortText({ displayName: 'Deal Name', required: false }),
    deal_stage: Property.ShortText({ displayName: 'Deal Stage', description: 'A Stage picklist value of your org, e.g. "Qualification".', required: false }),
    deal_closing_date: Property.ShortText({ displayName: 'Deal Closing Date', description: 'Date as yyyy-MM-dd, e.g. 2026-12-31.', required: false }),
    deal_amount: Property.Number({ displayName: 'Deal Amount', required: false }),
    deal_pipeline: Property.ShortText({ displayName: 'Deal Pipeline', description: 'Required when your org uses pipelines, e.g. "Standard (Standard)".', required: false }),
    deal_extra: Property.Json({ displayName: 'Other Deal Fields (JSON)', required: false }),
  },
  outputSchema: convertLeadOutputSchema,
  async run({ auth, propsValue }) {
    const deal: Record<string, unknown> = {};
    if (propsValue.create_deal === true) {
      Object.assign(deal, parseJsonObject({ value: propsValue.deal_extra, name: 'Other Deal Fields' }));
      if (!propsValue.deal_name || !propsValue.deal_stage || !propsValue.deal_closing_date) {
        throw new ZohoCrmError('To create a deal, Deal Name, Deal Stage and Deal Closing Date are required.');
      }
      deal['Deal_Name'] = propsValue.deal_name;
      deal['Stage'] = propsValue.deal_stage;
      deal['Closing_Date'] = convertFieldValue({ field: { api_name: 'Deal Closing Date', data_type: 'date' }, value: propsValue.deal_closing_date });
      if (propsValue.deal_amount !== undefined && propsValue.deal_amount !== null) deal['Amount'] = Number(propsValue.deal_amount);
      if (propsValue.deal_pipeline) deal['Pipeline'] = propsValue.deal_pipeline;
    }
    return convertLead({
      auth,
      leadId: requireId({ value: propsValue.lead_id, name: 'Lead' }),
      accountId: optionalId({ value: propsValue.account_id, name: 'Existing Account' }),
      contactId: optionalId({ value: propsValue.contact_id, name: 'Existing Contact' }),
      assignTo: optionalId({ value: propsValue.assign_to, name: 'Owner' }),
      overwrite: propsValue.overwrite === true ? true : undefined,
      notifyLeadOwner: propsValue.notify_lead_owner === true ? true : undefined,
      notifyNewEntityOwner: propsValue.notify_new_entity_owner === true ? true : undefined,
      deal,
    });
  },
});
