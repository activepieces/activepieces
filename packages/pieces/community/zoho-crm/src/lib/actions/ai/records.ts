import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../../auth';
import {
  ZohoCrmError,
  ZohoListResponse,
  optionalId,
  optionalInt,
  parseJsonObject,
  parseTriggers,
  requireApiName,
  requireId,
  stringList,
  validatePaging,
  zohoRequest,
} from '../../common/client';
import { defaultFieldSelection, listFields } from '../../common/metadata';
import { createRecord, deleteRecord, getRecord, updateRecord, upsertRecord } from '../../common/records';
import {
  aiUpsertOutputSchema,
  aiWriteOutputSchema,
  listRecordsOutputSchema,
} from '../../output-schemas-ai';
import { deleteOutputSchema, recordOutputSchema } from '../../output-schemas';

const moduleApiName = Property.ShortText({
  displayName: 'Module API Name',
  description: 'Module API name from List Modules, e.g. "Leads", "Contacts", "Deals" or "CustomModule1".',
  required: true,
});

const recordId = Property.ShortText({
  displayName: 'Record ID',
  description: 'Numeric Zoho record id, e.g. "5725767000000524157" (from List Records or a create result).',
  required: true,
});

const dataProp = (required: boolean) =>
  Property.Json({
    displayName: 'Data',
    description:
      'JSON object of field API names to values, e.g. {"Last_Name": "Doe", "Email": "jane@example.com", "Owner": {"id": "5725767000000411001"}}. Get API names and picklist values from Get Module Fields. Dates as "2026-10-01", date-times as "2026-10-01T09:00:00+02:00", lookups as {"id": "..."}.',
    required,
  });

const skipAutomation = Property.Checkbox({
  displayName: 'Skip Automation',
  description: 'When true, no workflow, approval or blueprint runs for this change. Default false (Zoho runs its automation).',
  required: false,
  defaultValue: false,
});

export const listRecordsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_records',
  classification: 'SEARCH',
  displayName: 'List Records',
  description: 'Lists records of a module, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists records of one Zoho CRM module one page at a time (up to 200), sorted by id, Created_Time or Modified_Time, optionally within a custom view. Use to browse or page through a module; it does not filter by field value, so use Get Record when you know the id. Returns at most 50 fields per record (default: id, then custom fields, then standard fields, up to 50). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Field API names to return (max 50). Leave empty for id, then the custom fields of the module, then its standard fields (50 in total).',
      required: false,
    }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1 to 200. Default 50.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number for the first 2,000 records. Do not combine with page_token.', required: false }),
    page_token: Property.ShortText({ displayName: 'Page Token', description: 'next_page_token from a previous call, needed beyond 2,000 records.', required: false }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: { options: ['id', 'Created_Time', 'Modified_Time'].map((v) => ({ label: v, value: v })) },
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      options: { options: [{ label: 'Descending', value: 'desc' }, { label: 'Ascending', value: 'asc' }] },
    }),
    custom_view_id: Property.ShortText({ displayName: 'Custom View ID', description: 'Optional id of a custom view (cvid) to list only its records.', required: false }),
  },
  outputSchema: listRecordsOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' });
    const perPage = optionalInt({ value: propsValue.per_page, name: 'per_page', min: 1, max: 200 }) ?? 50;
    const page = optionalInt({ value: propsValue.page, name: 'page', min: 1, max: 2000 });
    const pageToken = propsValue.page_token?.trim() || undefined;
    validatePaging({ page, perPage, pageToken, tokenSupported: true });
    const cvid = optionalId({ value: propsValue.custom_view_id, name: 'custom_view_id' });
    let fields = stringList(propsValue.fields).map((f) => requireApiName({ value: f, name: 'fields' }));
    if (fields.length > 50) {
      throw new ZohoCrmError('Zoho returns at most 50 fields per call.');
    }
    if (fields.length === 0) {
      fields = defaultFieldSelection({ fields: await listFields({ auth, module: module }) });
    }
    const sortBy = propsValue.sort_by;
    const sortOrder = propsValue.sort_order;
    const body = await zohoRequest<ZohoListResponse<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: `/${encodeURIComponent(module)}`,
      query: {
        fields: fields.join(','),
        per_page: String(perPage),
        ...(page ? { page: String(page) } : {}),
        ...(pageToken ? { page_token: pageToken } : {}),
        ...(sortBy ? { sort_by: sortBy } : {}),
        ...(sortOrder ? { sort_order: sortOrder } : {}),
        ...(cvid ? { cvid } : {}),
      },
    });
    const records = body?.data ?? [];
    return {
      module,
      records,
      count: records.length,
      more_records: body?.info?.more_records === true,
      page: body?.info?.page ?? page ?? null,
      next_page_token: body?.info?.next_page_token ?? null,
      fields_requested: fields.join(','),
    };
  },
});

export const getRecordAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Gets one record by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one Zoho CRM record by module API name and record id, with all fields (keys are field API names, custom fields included) unless a field list is given. Use when you hold a record id; use List Records to browse. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    fields: Property.Array({ displayName: 'Fields', description: 'Optional field API names to return; empty returns all fields.', required: false }),
  },
  outputSchema: recordOutputSchema,
  async run({ auth, propsValue }) {
    return getRecord({
      auth,
      module: requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' }),
      id: requireId({ value: propsValue.record_id, name: 'record_id' }),
      fields: stringList(propsValue.fields).map((f) => requireApiName({ value: f, name: 'fields' })),
    });
  },
});

export const createRecordAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a record in any module from a JSON object of fields.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one record in any Zoho CRM module (standard or custom) from a JSON object of field API names; prefer Create Lead, Create Contact, Create Deal or Create Event for those modules, and Upsert Record when the record may already exist. Resolve field API names and required fields with Get Module Fields first. Not idempotent: each call creates a new record.',
    idempotent: false,
  },
  props: {
    module_api_name: moduleApiName,
    data: dataProp(true),
    skip_automation: skipAutomation,
  },
  outputSchema: aiWriteOutputSchema,
  async run({ auth, propsValue }) {
    return createRecord({
      auth,
      module: requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' }),
      record: parseJsonObject({ value: propsValue.data, name: 'data' }),
      trigger: parseTriggers({ value: undefined, skipAll: propsValue.skip_automation }),
    });
  },
});

export const updateRecordAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates the given fields of a record; other fields are unchanged.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the fields present in data on one Zoho CRM record; fields you omit keep their values and a field set to null is cleared. Multi-select picklists are replaced unless listed in append_multiselect_fields. Not idempotent: every call counts as an edit and runs the module\'s on-edit workflows unless automation is skipped.',
    idempotent: false,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    data: dataProp(true),
    append_multiselect_fields: Property.Array({
      displayName: 'Append Multi-Select Fields',
      description: 'Multi-select picklist API names whose new values should be added to the current ones instead of replacing them.',
      required: false,
    }),
    skip_automation: skipAutomation,
  },
  outputSchema: aiWriteOutputSchema,
  async run({ auth, propsValue }) {
    const record = parseJsonObject({ value: propsValue.data, name: 'data' });
    if ('id' in record) {
      throw new ZohoCrmError('Do not put "id" in data; pass it as record_id.');
    }
    return updateRecord({
      auth,
      module: requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' }),
      id: requireId({ value: propsValue.record_id, name: 'record_id' }),
      record,
      appendMultiSelect: stringList(propsValue.append_multiselect_fields).map((f) => requireApiName({ value: f, name: 'append_multiselect_fields' })),
      trigger: parseTriggers({ value: undefined, skipAll: propsValue.skip_automation }),
    });
  },
});

export const deleteRecordAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Deletes a record (moves it to the Recycle Bin).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one Zoho CRM record by module and id; it moves to the Recycle Bin, restorable only from the Zoho UI. Only use when the user asked to delete; to change data use Update Record. Not idempotent: a second call on the same id fails.',
    idempotent: false,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    run_workflows: Property.Checkbox({ displayName: 'Run Workflows', description: 'Default true.', required: false, defaultValue: true }),
  },
  outputSchema: deleteOutputSchema,
  async run({ auth, propsValue }) {
    return deleteRecord({
      auth,
      module: requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' }),
      id: requireId({ value: propsValue.record_id, name: 'record_id' }),
      runWorkflows: propsValue.run_workflows !== false,
    });
  },
});

export const upsertRecordAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_upsert_record',
  classification: 'WRITE',
  displayName: 'Upsert Record',
  description: 'Updates the matching record or creates it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts or updates one Zoho CRM record, matching on duplicate_check_fields (Zoho default: Email for Leads/Contacts, Account_Name for Accounts, Deal_Name for Deals, Name for custom modules); the result says action insert or update. Use as find-or-create. Not idempotent: when the data has no value for a duplicate-check field, every call inserts a new record.',
    idempotent: false,
  },
  props: {
    module_api_name: moduleApiName,
    data: dataProp(true),
    duplicate_check_fields: Property.Array({
      displayName: 'Duplicate Check Fields',
      description: 'Field API names to match on, e.g. ["Email"]. Empty uses the module default.',
      required: false,
    }),
    skip_automation: skipAutomation,
  },
  outputSchema: aiUpsertOutputSchema,
  async run({ auth, propsValue }) {
    return upsertRecord({
      auth,
      module: requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' }),
      record: parseJsonObject({ value: propsValue.data, name: 'data' }),
      duplicateCheckFields: stringList(propsValue.duplicate_check_fields).map((f) => requireApiName({ value: f, name: 'duplicate_check_fields' })),
      trigger: parseTriggers({ value: undefined, skipAll: propsValue.skip_automation }),
    });
  },
});
