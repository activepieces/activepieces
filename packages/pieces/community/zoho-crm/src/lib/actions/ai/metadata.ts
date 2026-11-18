import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../../auth';
import { ZohoCrmError, optionalInt, requireApiName, requireId, validatePaging, zohoRequest } from '../../common/client';
import { flattenRelatedList, flattenUser } from '../../common/flatten';
import { isApiReadOnly } from '../../common/fields';
import { listFields, listModules } from '../../common/metadata';
import {
  listModulesOutputSchema,
  listUsersOutputSchema,
  moduleFieldsOutputSchema,
  relatedListsOutputSchema,
  userOutputSchema,
} from '../../output-schemas-ai';

const moduleApiName = Property.ShortText({
  displayName: 'Module API Name',
  description: 'Module API name from List Modules, e.g. "Leads", "Contacts", "Deals", "Accounts" or "CustomModule1". Not the display label.',
  required: true,
});

export const listModulesAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_modules',
  classification: 'SEARCH',
  displayName: 'List Modules',
  description: 'Lists the modules available through the API.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Zoho CRM modules the API can use, with each module\'s API name, labels and whether records can be created, edited or deleted. Call this first to get the module_api_name every record, note, tag and attachment action needs; the API name can differ from the label (e.g. "Deals" labelled "Opportunities", custom modules named "CustomModule1"). Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: listModulesOutputSchema,
  async run({ auth }) {
    const modules = (await listModules(auth))
      .filter((m) => m.api_supported !== false)
      .map((m) => ({
        api_name: m.api_name,
        module_name: m.module_name ?? null,
        plural_label: m.plural_label ?? null,
        singular_label: m.singular_label ?? null,
        generated_type: m.generated_type ?? null,
        creatable: m.creatable ?? null,
        editable: m.editable ?? null,
        deletable: m.deletable ?? null,
      }));
    return { modules, count: modules.length };
  },
});

export const getModuleFieldsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_get_module_fields',
  classification: 'SEARCH',
  displayName: 'Get Module Fields',
  description: 'Lists the fields of a module, custom fields included.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every field of one Zoho CRM module with its API name, label, data type, whether it is required on create, read-only status, picklist values and lookup target. Call before creating or updating records to learn field API names, allowed picklist values (e.g. Deal Stage) and custom fields. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    include_read_only: Property.Checkbox({
      displayName: 'Include Read-Only Fields',
      description: 'Also list fields that cannot be written (formula, system, auto-number).',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: moduleFieldsOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' });
    const all = await listFields({ auth, module: module });
    const fields = all
      .filter((f) => f.visible !== false)
      .filter((f) => propsValue.include_read_only !== false || !isApiReadOnly(f))
      .map((f) => ({
        api_name: f.api_name,
        field_label: f.display_label ?? f.field_label ?? f.api_name,
        data_type: f.data_type ?? null,
        required: f.system_mandatory === true,
        read_only: isApiReadOnly(f),
        custom_field: f.custom_field === true,
        lookup_module: f.lookup?.module?.api_name ?? null,
        max_length: f.length ?? null,
        picklist_values: (f.pick_list_values ?? [])
          .map((p) => p.actual_value)
          .filter((v): v is string => typeof v === 'string' && v !== '-None-'),
      }));
    return { module, fields, count: fields.length };
  },
});

export const getRelatedListsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_get_related_lists',
  classification: 'SEARCH',
  displayName: 'Get Related Lists',
  description: 'Lists the related lists of a module.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the related lists of one Zoho CRM module (e.g. Contacts, Deals or Campaigns under Accounts) with the related_list API name and the related module. Call before List Related Records or Link Related Record to get the related_list_api_name. Read-only and idempotent.',
    idempotent: true,
  },
  props: { module_api_name: moduleApiName },
  outputSchema: relatedListsOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' });
    const body = await zohoRequest<{ related_lists?: Record<string, unknown>[] }>({
      auth,
      method: HttpMethod.GET,
      path: '/settings/related_lists',
      query: { module },
    });
    const related_lists = (body?.related_lists ?? []).map(flattenRelatedList);
    return { module, related_lists, count: related_lists.length };
  },
});

const USER_TYPES = [
  'AllUsers',
  'ActiveUsers',
  'DeactiveUsers',
  'ConfirmedUsers',
  'NotConfirmedUsers',
  'DeletedUsers',
  'ActiveConfirmedUsers',
  'AdminUsers',
  'ActiveConfirmedAdmins',
];

export const listUsersAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'Lists CRM users.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists users of the Zoho CRM org, filtered by type (active users by default), one page of up to 200 (page numbers reach the first 2,000 users). Use to find a user id for a record Owner or a lead conversion assignee; use Get Current User for the connected user. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'User Type',
      required: false,
      defaultValue: 'ActiveUsers',
      options: { options: USER_TYPES.map((t) => ({ label: t, value: t })) },
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1 to 200 (default 200).', required: false }),
  },
  outputSchema: listUsersOutputSchema,
  async run({ auth, propsValue }) {
    const type = propsValue.type ?? 'ActiveUsers';
    if (!USER_TYPES.includes(type)) {
      throw new ZohoCrmError(`type must be one of ${USER_TYPES.join(', ')}.`);
    }
    const page = optionalInt({ value: propsValue.page, name: 'page', min: 1, max: 2000 });
    const perPage = optionalInt({ value: propsValue.per_page, name: 'per_page', min: 1, max: 200 });
    validatePaging({ page, perPage: perPage ?? 200, tokenSupported: false });
    const body = await zohoRequest<{ users?: Record<string, unknown>[]; info?: { more_records?: boolean } }>({
      auth,
      method: HttpMethod.GET,
      path: '/users',
      query: {
        type,
        ...(page ? { page: String(page) } : {}),
        ...(perPage ? { per_page: String(perPage) } : {}),
      },
    });
    const users = (body?.users ?? []).map(flattenUser);
    return { users, count: users.length, more_records: body?.info?.more_records === true };
  },
});

export const getUserAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Gets a CRM user by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one Zoho CRM user by id with name, email, role, profile and status. Use to resolve an Owner id seen on a record; to find users by listing use List Users. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Numeric user id, e.g. "5725767000000411001".', required: true }),
  },
  outputSchema: userOutputSchema,
  async run({ auth, propsValue }) {
    const id = requireId({ value: propsValue.user_id, name: 'user_id' });
    const body = await zohoRequest<{ users?: Record<string, unknown>[] }>({ auth, method: HttpMethod.GET, path: `/users/${id}` });
    const user = body?.users?.[0];
    if (!user) {
      throw new ZohoCrmError(`No user with id ${id} was found.`, 404, 'NOT_FOUND');
    }
    return flattenUser(user);
  },
});

export const getCurrentUserAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Gets the connected CRM user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the Zoho CRM user this connection acts as (id, name, email, role, profile). Use to get the default Owner id or the "from" address for an email draft. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: userOutputSchema,
  async run({ auth }) {
    const body = await zohoRequest<{ users?: Record<string, unknown>[] }>({
      auth,
      method: HttpMethod.GET,
      path: '/users',
      query: { type: 'CurrentUser' },
    });
    const user = body?.users?.[0];
    if (!user) {
      throw new ZohoCrmError('Zoho did not return the current user.');
    }
    return flattenUser(user);
  },
});
