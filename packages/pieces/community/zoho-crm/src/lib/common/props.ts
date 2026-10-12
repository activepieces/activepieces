import { HttpMethod } from '@activepieces/pieces-common';
import { InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { ZohoAuth, ZohoListResponse, errorText, readField, readString, zohoRequest } from './client';
import { FieldMode, buildFieldProps, fieldsJsonFallbackProp } from './fields';
import { listFields, listModules, nameFieldOf } from './metadata';

export function moduleDropdown({
  displayName = 'Module',
  description = 'The Zoho CRM module (for example Leads, Contacts, Deals or a custom module).',
  filter = 'any',
  required = true,
}: {
  displayName?: string;
  description?: string;
  filter?: ModuleFilter;
  required?: boolean;
} = {}) {
  return Property.Dropdown({
    auth: zohoCrmAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Zoho CRM account first' };
      }
      try {
        const modules = await listModules(auth);
        return {
          disabled: false,
          options: modules
            .filter((m) => m.api_supported !== false)
            .filter((m) => filter === 'any' || m[filter] !== false)
            .map((m) => ({ label: m.plural_label ?? m.api_name, value: m.api_name })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load modules: ${errorText(error)}` };
      }
    },
  });
}

export function recordDropdown({
  displayName = 'Record',
  description = 'Pick one of the 200 most recently modified records, or map a record id from an earlier step.',
  moduleProp = 'module',
  fixedModule,
  required = true,
}: {
  displayName?: string;
  description?: string;
  moduleProp?: string;
  fixedModule?: string;
  required?: boolean;
} = {}) {
  return Property.Dropdown({
    auth: zohoCrmAuth,
    displayName,
    description,
    required,
    refreshers: fixedModule ? [] : [moduleProp],
    options: async (props) => {
      const auth = props.auth;
      const module = fixedModule ?? props[moduleProp];
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Zoho CRM account first' };
      }
      if (typeof module !== 'string' || module.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a module first' };
      }
      try {
        const fields = await listFields({ auth, module });
        const nameField = nameFieldOf(fields);
        const body = await zohoRequest<ZohoListResponse<Record<string, unknown>>>({
          auth,
          method: HttpMethod.GET,
          path: `/${encodeURIComponent(module)}`,
          query: {
            fields: nameField ? `id,${nameField}` : 'id',
            per_page: '200',
            sort_by: 'Modified_Time',
            sort_order: 'desc',
          },
        });
        const records = body?.data ?? [];
        return {
          disabled: false,
          placeholder:
            records.length === 0
              ? 'No records in this module'
              : body?.info?.more_records === true
                ? `Showing the ${records.length} most recently modified records; map a record id for others.`
                : undefined,
          options: records.map((r) => {
            const id = String(r['id']);
            const name = nameField ? r[nameField] : undefined;
            return { label: typeof name === 'string' && name.length > 0 ? `${name} (${id})` : id, value: id };
          }),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load records: ${errorText(error)}` };
      }
    },
  });
}

export function recordFieldsProp({ mode, moduleProp = 'module' }: { mode: FieldMode; moduleProp?: string }) {
  return Property.DynamicProperties({
    auth: zohoCrmAuth,
    displayName: 'Fields',
    description:
      mode === 'update'
        ? 'Only the fields you fill in are changed. Use "Clear Fields" to blank a field.'
        : 'Standard and custom fields of the module. Read-only, formula, subform and file fields are not listed.',
    required: mode === 'create',
    refreshers: [moduleProp],
    props: async (props): Promise<InputPropertyMap> => {
      const auth = props.auth;
      const module = props[moduleProp];
      if (!auth || typeof module !== 'string' || module.length === 0) {
        return {};
      }
      try {
        const fields = await listFields({ auth, module });
        return buildFieldProps({ fields, mode });
      } catch (error) {
        return fieldsJsonFallbackProp({ reason: errorText(error), mode });
      }
    },
  });
}

export function uniqueFieldsDropdown(moduleProp = 'module') {
  return Property.MultiSelectDropdown({
    auth: zohoCrmAuth,
    displayName: 'Duplicate Check Fields',
    description:
      'Fields used to find an existing record. Leave empty to use Zoho\'s default (Email for Leads/Contacts, Account_Name for Accounts, Deal_Name for Deals, Name for custom modules).',
    required: false,
    refreshers: [moduleProp],
    options: async (props) => {
      const auth = props.auth;
      const module = props[moduleProp];
      if (!auth || typeof module !== 'string' || module.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a module first' };
      }
      try {
        const fields = await listFields({ auth, module });
        return {
          disabled: false,
          options: fields
            .filter((f) => f.visible !== false && !f.read_only && ['text', 'email', 'phone', 'website', 'integer', 'bigint', 'autonumber'].includes(f.data_type ?? ''))
            .map((f) => ({ label: f.display_label ?? f.field_label ?? f.api_name, value: f.api_name })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load fields: ${errorText(error)}` };
      }
    },
  });
}

export function tagsDropdown(moduleProp = 'module') {
  return Property.MultiSelectDropdown({
    auth: zohoCrmAuth,
    displayName: 'Existing Tags',
    description: 'Tags already defined for the module.',
    required: false,
    refreshers: [moduleProp],
    options: async (props) => {
      const auth = props.auth;
      const module = props[moduleProp];
      if (!auth || typeof module !== 'string' || module.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a module first' };
      }
      try {
        const body = await zohoRequest<{ tags?: { name: string }[] }>({
          auth,
          method: HttpMethod.GET,
          path: '/settings/tags',
          query: { module },
        });
        return {
          disabled: false,
          options: (body?.tags ?? []).map((t) => ({ label: t.name, value: t.name })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load tags: ${errorText(error)}` };
      }
    },
  });
}

export function userDropdown({
  displayName,
  description,
  required = false,
}: {
  displayName: string;
  description: string;
  required?: boolean;
}) {
  return Property.Dropdown({
    auth: zohoCrmAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Zoho CRM account first' };
      }
      const { users, notice } = await listActiveUsers({ auth });
      if (users.length === 0 && notice) {
        return { disabled: true, options: [], placeholder: notice };
      }
      return {
        disabled: false,
        placeholder: notice,
        options: users.map((u) => ({ label: u.email ? `${u.name} (${u.email})` : u.name, value: u.id })),
      };
    },
  });
}

async function listActiveUsers({ auth }: { auth: ZohoAuth }): Promise<{ users: UserOption[]; notice?: string }> {
  const users: UserOption[] = [];
  for (let page = 1; page <= MAX_USER_PAGES; page++) {
    let body: { users?: unknown[]; info?: { more_records?: boolean } } | undefined;
    try {
      body = await zohoRequest<{ users?: unknown[]; info?: { more_records?: boolean } }>({
        auth,
        method: HttpMethod.GET,
        path: '/users',
        query: { type: 'ActiveUsers', per_page: String(USERS_PER_PAGE), page: String(page) },
      });
    } catch (error) {
      const reason = errorText(error);
      return { users, notice: users.length === 0 ? `Could not load users: ${reason}` : `Showing the first ${users.length} users; the rest could not be loaded (${reason}).` };
    }
    users.push(...(body?.users ?? []).flatMap(toUserOption));
    if (body?.info?.more_records !== true) {
      return { users };
    }
  }
  return { users, notice: `Showing the first ${users.length} active users; map a user id for anyone else.` };
}

function toUserOption(user: unknown): UserOption[] {
  const id = readString(readField({ value: user, key: 'id' }));
  if (!id) {
    return [];
  }
  const name = readString(readField({ value: user, key: 'full_name' })) ?? id;
  return [{ id, name, email: readString(readField({ value: user, key: 'email' })) }];
}

const USERS_PER_PAGE = 200;
const MAX_USER_PAGES = 10;

type UserOption = { id: string; name: string; email?: string };

export function additionalFieldsProp() {
  return Property.Json({
    displayName: 'Additional Fields (JSON)',
    description:
      'Optional raw fields by API name, for fields the form does not list (e.g. subform rows). Values set in the form above win over the same key here.',
    required: false,
  });
}

type ModuleFilter = 'any' | 'creatable' | 'editable' | 'deletable';
