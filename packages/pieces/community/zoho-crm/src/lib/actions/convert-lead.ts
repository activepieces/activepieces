import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
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
    link_info: Property.MarkDown({
      value: 'Leave both empty to create a new contact and account.',
      variant: MarkdownVariant.INFO,
    }),
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
    overwrite: Property.Checkbox({ displayName: 'Move Contact to Account', description: 'Reassign the existing contact to the account above.', required: false, defaultValue: false }),
    assign_to: userDropdown({
      displayName: 'Owner',
      description: 'Active user who owns the new records; empty keeps the lead owner.',
    }),
    notify_lead_owner: Property.Checkbox({ displayName: 'Notify Lead Owner', description: 'Email the lead\'s owner about the conversion.', required: false, defaultValue: false }),
    notify_new_entity_owner: Property.Checkbox({ displayName: 'Notify New Owner', description: 'Email the owner of the new records.', required: false, defaultValue: false }),
    create_deal: Property.Checkbox({
      displayName: 'Create a Deal',
      description: 'Also create a deal from the lead.',
      reveals: ['deal_name', 'deal_stage', 'deal_closing_date', 'deal_amount', 'deal_pipeline', 'deal_extra'],
      required: false,
      defaultValue: false,
    }),
    deal_name: Property.ShortText({ displayName: 'Deal Name', description: 'Required to create a deal.', required: false }),
    deal_stage: Property.ShortText({ displayName: 'Deal Stage', description: 'Required. A Stage value from your org.', placeholder: 'Qualification', required: false }),
    deal_closing_date: Property.ShortText({ displayName: 'Deal Closing Date', description: 'Required. Date as yyyy-MM-dd.', placeholder: '2026-12-31', required: false }),
    deal_amount: Property.Number({ displayName: 'Deal Amount', required: false }),
    deal_pipeline: Property.ShortText({ displayName: 'Deal Pipeline', description: 'Required when your org uses pipelines.', placeholder: 'Standard (Standard)', required: false }),
    deal_extra: Property.Json({ displayName: 'Other Deal Fields', description: 'JSON of more deal fields, by API name.', required: false }),
  },
  propertyGroups: [
    { key: 'lead', display: 'section', label: 'Lead', icon: 'user', props: ['lead_id'] },
    { key: 'existing', display: 'section', label: 'Link to Existing', icon: 'users', props: ['link_info', 'account_id', 'contact_id', 'overwrite'] },
    { key: 'owner', display: 'section', label: 'Owner and Notifications', icon: 'user', props: ['assign_to', 'notify_lead_owner', 'notify_new_entity_owner'] },
    { key: 'deal', display: 'section', label: 'Deal', icon: 'tag', props: ['create_deal'] },
  ],
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
