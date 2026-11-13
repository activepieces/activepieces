import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../../auth';
import { ZohoCrmError, optionalId, parseJsonObject, requireApiName, requireId } from '../../common/client';
import { convertFieldValue } from '../../common/fields';
import { convertLead, createRecord } from '../../common/records';
import { aiWriteOutputSchema } from '../../output-schemas-ai';
import { convertLeadOutputSchema } from '../../output-schemas';

const additionalFields = Property.Json({
  displayName: 'Additional Fields',
  description: 'Optional JSON of other field API names, including custom fields, e.g. {"Custom_Field__c": "x"}. The named props above win over the same key here.',
  required: false,
});

const ownerId = Property.ShortText({
  displayName: 'Owner User ID',
  description: 'Optional user id (from List Users or Get Current User). Default: the connected user.',
  required: false,
});

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function withCommon({ record, extra, owner }: { record: Record<string, unknown>; extra: unknown; owner: unknown }): Record<string, unknown> {
  const id = optionalId({ value: owner, name: 'owner_id' });
  return { ...parseJsonObject({ value: extra, name: 'additional_fields' }), ...record, ...(id ? { Owner: { id } } : {}) };
}

function lookup({ value, name }: { value: unknown; name: string }): { id: string } | undefined {
  const id = optionalId({ value, name });
  return id ? { id } : undefined;
}

function dateOnly({ value, name }: { value: unknown; name: string }): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(convertFieldValue({ field: { api_name: name, data_type: 'date' }, value }));
}

function dateTime({ value, name }: { value: unknown; name: string }): string {
  return String(convertFieldValue({ field: { api_name: name, data_type: 'datetime' }, value }));
}

function num({ value, name }: { value: unknown; name: string }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(convertFieldValue({ field: { api_name: name, data_type: 'double' }, value }));
}

export const createLeadAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_lead',
  classification: 'WRITE',
  displayName: 'Create Lead',
  description: 'Creates a lead.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Zoho CRM lead with typed fields (Last Name required; company, email, phone, source, status) plus optional custom fields. Use for new prospects; use Upsert Record on Leads with Email to avoid duplicates, or Create Contact for an existing customer. Not idempotent: each call creates another lead.',
    idempotent: false,
  },
  props: {
    last_name: Property.ShortText({ displayName: 'Last Name', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    company: Property.ShortText({ displayName: 'Company', description: 'Required in many orgs\' layouts.', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    mobile: Property.ShortText({ displayName: 'Mobile', required: false }),
    title: Property.ShortText({ displayName: 'Title', description: 'Job title (Designation).', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    lead_source: Property.ShortText({ displayName: 'Lead Source', description: 'A Lead_Source picklist value of your org, e.g. "Web Download".', required: false }),
    lead_status: Property.ShortText({ displayName: 'Lead Status', description: 'A Lead_Status picklist value of your org, e.g. "Not Contacted".', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    owner_id: ownerId,
    additional_fields: additionalFields,
  },
  outputSchema: aiWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    const record = compact({
      Last_Name: p.last_name,
      First_Name: p.first_name,
      Company: p.company,
      Email: p.email,
      Phone: p.phone,
      Mobile: p.mobile,
      Designation: p.title,
      Website: p.website,
      Lead_Source: p.lead_source,
      Lead_Status: p.lead_status,
      Description: p.description,
    });
    return createRecord({ auth, module: 'Leads', record: withCommon({ record, extra: p.additional_fields, owner: p.owner_id }) });
  },
});

export const createContactAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Zoho CRM contact with typed fields (Last Name required; email, phone, account, mailing address) plus optional custom fields. Use for a person tied to a customer account; use Upsert Record on Contacts with Email to avoid duplicates. Not idempotent: each call creates another contact.',
    idempotent: false,
  },
  props: {
    last_name: Property.ShortText({ displayName: 'Last Name', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    mobile: Property.ShortText({ displayName: 'Mobile', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    account_id: Property.ShortText({ displayName: 'Account ID', description: 'Id of an existing Accounts record.', required: false }),
    mailing_street: Property.ShortText({ displayName: 'Mailing Street', required: false }),
    mailing_city: Property.ShortText({ displayName: 'Mailing City', required: false }),
    mailing_state: Property.ShortText({ displayName: 'Mailing State', required: false }),
    mailing_zip: Property.ShortText({ displayName: 'Mailing Zip', required: false }),
    mailing_country: Property.ShortText({ displayName: 'Mailing Country', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    owner_id: ownerId,
    additional_fields: additionalFields,
  },
  outputSchema: aiWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    const record = compact({
      Last_Name: p.last_name,
      First_Name: p.first_name,
      Email: p.email,
      Phone: p.phone,
      Mobile: p.mobile,
      Title: p.title,
      Account_Name: lookup({ value: p.account_id, name: 'account_id' }),
      Mailing_Street: p.mailing_street,
      Mailing_City: p.mailing_city,
      Mailing_State: p.mailing_state,
      Mailing_Zip: p.mailing_zip,
      Mailing_Country: p.mailing_country,
      Description: p.description,
    });
    return createRecord({ auth, module: 'Contacts', record: withCommon({ record, extra: p.additional_fields, owner: p.owner_id }) });
  },
});

export const createDealAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_deal',
  classification: 'WRITE',
  displayName: 'Create Deal',
  description: 'Creates a deal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Zoho CRM deal (Deal Name and Stage required; amount, closing date, pipeline, account and contact optional). Stage and Pipeline values are org-specific, so read them from Get Module Fields on Deals first. Not idempotent: each call creates another deal.',
    idempotent: false,
  },
  props: {
    deal_name: Property.ShortText({ displayName: 'Deal Name', required: true }),
    stage: Property.ShortText({ displayName: 'Stage', description: 'A Stage picklist value of your org, e.g. "Qualification".', required: true }),
    closing_date: Property.ShortText({ displayName: 'Closing Date', description: 'yyyy-MM-dd, e.g. "2026-12-31". Required in many layouts.', required: false }),
    amount: Property.Number({ displayName: 'Amount', required: false }),
    pipeline: Property.ShortText({ displayName: 'Pipeline', description: 'Pipeline name when the org uses pipelines, e.g. "Standard (Standard)".', required: false }),
    account_id: Property.ShortText({ displayName: 'Account ID', required: false }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    owner_id: ownerId,
    additional_fields: additionalFields,
  },
  outputSchema: aiWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    const record = compact({
      Deal_Name: p.deal_name,
      Stage: p.stage,
      Closing_Date: dateOnly({ value: p.closing_date, name: 'closing_date' }),
      Amount: num({ value: p.amount, name: 'amount' }),
      Pipeline: p.pipeline,
      Account_Name: lookup({ value: p.account_id, name: 'account_id' }),
      Contact_Name: lookup({ value: p.contact_id, name: 'contact_id' }),
      Description: p.description,
    });
    return createRecord({ auth, module: 'Deals', record: withCommon({ record, extra: p.additional_fields, owner: p.owner_id }) });
  },
});

export const createEventAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_event',
  classification: 'WRITE',
  displayName: 'Create Event',
  description: 'Creates a calendar event (meeting).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Zoho CRM event (meeting) with a title, start and end date-time, optional venue and an optional link to a record (What_Id plus its module, e.g. a Deal or Account). Use to log or schedule a meeting against a CRM record. Not idempotent: each call creates another event.',
    idempotent: false,
  },
  props: {
    event_title: Property.ShortText({ displayName: 'Title', required: true }),
    start_datetime: Property.ShortText({ displayName: 'Start', description: 'ISO 8601 with offset, e.g. "2026-10-01T09:00:00+02:00".', required: true }),
    end_datetime: Property.ShortText({ displayName: 'End', description: 'ISO 8601 with offset, after Start.', required: true }),
    all_day: Property.Checkbox({ displayName: 'All Day', required: false, defaultValue: false }),
    venue: Property.ShortText({ displayName: 'Venue', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    related_module: Property.ShortText({ displayName: 'Related Module', description: 'Module API name of the record to link (What_Id), e.g. "Deals" or "Accounts". Give with related_record_id.', required: false }),
    related_record_id: Property.ShortText({ displayName: 'Related Record ID', required: false }),
    owner_id: ownerId,
    additional_fields: additionalFields,
  },
  outputSchema: aiWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    const start = dateTime({ value: p.start_datetime, name: 'start_datetime' });
    const end = dateTime({ value: p.end_datetime, name: 'end_datetime' });
    if (Date.parse(end) < Date.parse(start)) {
      throw new ZohoCrmError('end_datetime must not be before start_datetime.');
    }
    const relatedId = optionalId({ value: p.related_record_id, name: 'related_record_id' });
    if ((relatedId === undefined) !== (!p.related_module)) {
      throw new ZohoCrmError('Give related_module and related_record_id together.');
    }
    const record = compact({
      Event_Title: p.event_title,
      Start_DateTime: start,
      End_DateTime: end,
      All_day: p.all_day === true ? true : undefined,
      Venue: p.venue,
      Description: p.description,
      What_Id: relatedId ? { id: relatedId } : undefined,
      $se_module: relatedId && p.related_module ? requireApiName({ value: p.related_module, name: 'related_module' }) : undefined,
    });
    return createRecord({ auth, module: 'Events', record: withCommon({ record, extra: p.additional_fields, owner: p.owner_id }) });
  },
});

export const convertLeadAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_convert_lead',
  classification: 'WRITE',
  displayName: 'Convert Lead',
  description: 'Converts a lead to a contact, account and optional deal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Converts one Zoho CRM lead into a contact and account (new, or existing ones by id) and optionally creates a deal when deal_name is given (deal_stage and deal_closing_date then required). Use once a lead is qualified. Not idempotent: a converted lead cannot be converted again (ID_ALREADY_CONVERTED).',
    idempotent: false,
  },
  props: {
    lead_id: Property.ShortText({ displayName: 'Lead ID', required: true }),
    account_id: Property.ShortText({ displayName: 'Existing Account ID', required: false }),
    contact_id: Property.ShortText({ displayName: 'Existing Contact ID', required: false }),
    assign_to: Property.ShortText({ displayName: 'Owner User ID', required: false }),
    overwrite: Property.Checkbox({ displayName: 'Overwrite Contact Account', required: false, defaultValue: false }),
    notify_lead_owner: Property.Checkbox({ displayName: 'Notify Lead Owner', required: false, defaultValue: false }),
    notify_new_entity_owner: Property.Checkbox({ displayName: 'Notify New Owner', required: false, defaultValue: false }),
    deal_name: Property.ShortText({ displayName: 'Deal Name', description: 'Set to also create a deal.', required: false }),
    deal_stage: Property.ShortText({ displayName: 'Deal Stage', required: false }),
    deal_closing_date: Property.ShortText({ displayName: 'Deal Closing Date', description: 'yyyy-MM-dd.', required: false }),
    deal_amount: Property.Number({ displayName: 'Deal Amount', required: false }),
    deal_pipeline: Property.ShortText({ displayName: 'Deal Pipeline', required: false }),
  },
  outputSchema: convertLeadOutputSchema,
  async run({ auth, propsValue: p }) {
    if (p.deal_name && (!p.deal_stage || !p.deal_closing_date)) {
      throw new ZohoCrmError('deal_stage and deal_closing_date are required when deal_name is set.');
    }
    const deal = p.deal_name
      ? compact({
          Deal_Name: p.deal_name,
          Stage: p.deal_stage,
          Closing_Date: dateOnly({ value: p.deal_closing_date, name: 'deal_closing_date' }),
          Amount: num({ value: p.deal_amount, name: 'deal_amount' }),
          Pipeline: p.deal_pipeline,
        })
      : {};
    return convertLead({
      auth,
      leadId: requireId({ value: p.lead_id, name: 'lead_id' }),
      accountId: optionalId({ value: p.account_id, name: 'account_id' }),
      contactId: optionalId({ value: p.contact_id, name: 'contact_id' }),
      assignTo: optionalId({ value: p.assign_to, name: 'assign_to' }),
      overwrite: p.overwrite === true ? true : undefined,
      notifyLeadOwner: p.notify_lead_owner === true ? true : undefined,
      notifyNewEntityOwner: p.notify_new_entity_owner === true ? true : undefined,
      deal,
    });
  },
});
