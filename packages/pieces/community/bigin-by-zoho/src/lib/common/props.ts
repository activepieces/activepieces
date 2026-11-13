import { Property } from '@activepieces/pieces-framework';
import { biginApiService, getBiginConnection, isObject } from './request';
import { handleDropdownError } from './helpers';
import { BIGIN_RECORD_MODULES } from './constants';
import { biginRecords } from './records';
import { biginAuth } from '../auth';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function userLabel(user: Record<string, unknown>): string {
  const full = str(user['full_name']).trim();
  if (full !== '') return full;
  const parts = [str(user['first_name']), str(user['last_name'])].filter((p) => p.trim() !== '').join(' ');
  return parts || str(user['email']) || str(user['id']);
}

function contactLabel(record: Record<string, unknown>): string {
  return `${str(record['First_Name'])} ${str(record['Last_Name'])}`.trim() || str(record['id']);
}

function toObjects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

async function loadAllUsers({ accessToken, apiDomain }: { accessToken: string; apiDomain: string }) {
  const users: Record<string, unknown>[] = [];
  for (let page = 1; page <= 5; page++) {
    const response = await biginApiService.fetchUsers(accessToken, apiDomain, { page, per_page: 200 });
    const body = isObject(response) ? response : {};
    users.push(...toObjects(body['users']));
    const info = isObject(body['info']) ? body['info'] : {};
    if (info['more_records'] !== true) break;
  }
  return users;
}

function findPipelineField({ layout, apiName, label }: { layout: Record<string, unknown>; apiName: string; label: string }) {
  for (const section of toObjects(layout['sections'])) {
    for (const field of toObjects(section['fields'])) {
      if (field['api_name'] === apiName || field['field_label'] === label) return field;
    }
  }
  return undefined;
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return isObject(value) ? value : {};
  try {
    const parsed: unknown = JSON.parse(value);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export const usersDropdown = Property.Dropdown({
  auth: biginAuth,
  displayName: 'Owner',
  description: 'Select the owner to which the record will be assigned.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return handleDropdownError('Please connect your account first');
    try {
      const users = await loadAllUsers(getBiginConnection(auth));
      if (users.length === 0) return handleDropdownError('No users found');
      return {
        disabled: false,
        options: users.map((user) => ({ label: userLabel(user), value: str(user['id']) })),
      };
    } catch {
      return handleDropdownError('Failed to load users');
    }
  },
});

export const companyDropdown = Property.Dropdown({
  auth: biginAuth,
  displayName: 'Company',
  description:
    'The ID of the company to which the record will be associated. If not provided, the record will not be associated with any company.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    try {
      const records = await biginRecords.listAll({
        connection: getBiginConnection(auth),
        module: 'Accounts',
        fields: 'Account_Name',
      });
      return {
        disabled: false,
        options: records.map((a) => ({ label: str(a['Account_Name']) || str(a['id']), value: str(a['id']) })),
      };
    } catch {
      return handleDropdownError('Failed to load companies');
    }
  },
});

export const contactsDropdown = Property.Dropdown({
  auth: biginAuth,
  displayName: 'Contacts',
  description:
    'The ID of the contact to which the record will be associated. If not provided, the record will not be associated with any contact.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    try {
      const records = await biginRecords.listAll({
        connection: getBiginConnection(auth),
        module: 'Contacts',
        fields: 'First_Name,Last_Name',
      });
      return {
        disabled: false,
        options: records.map((a) => ({ label: contactLabel(a), value: str(a['id']) })),
      };
    } catch {
      return handleDropdownError('Failed to load contacts');
    }
  },
});

export const multiContactsDropdown = Property.MultiSelectDropdown({
  auth: biginAuth,
  displayName: 'Secondary Contacts',
  description: 'Provide a list of additional contacts associated with the record',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    try {
      const records = await biginRecords.listAll({
        connection: getBiginConnection(auth),
        module: 'Contacts',
        fields: 'First_Name,Last_Name',
      });
      return {
        disabled: false,
        options: records.map((a) => ({ label: contactLabel(a), value: str(a['id']) })),
      };
    } catch {
      return handleDropdownError('Failed to load contacts');
    }
  },
});

export const pipelineRecordsDropdown = Property.Dropdown({
  auth: biginAuth,
  displayName: 'Pipeline Record',
  description: 'Select a pipeline record',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    try {
      const records = await biginRecords.listAll({
        connection: getBiginConnection(auth),
        module: 'Pipelines',
        fields: 'Deal_Name,Stage,Owner,Description,Contact_Name,Account_Name,Amount,Closing_Date,Sub_Pipeline,Tag',
      });
      return {
        disabled: false,
        options: records.map((a) => ({ label: str(a['Deal_Name']) || str(a['id']), value: JSON.stringify(a) })),
      };
    } catch {
      return handleDropdownError('Failed to load pipeline records');
    }
  },
});

export const layoutsDropdown = (displayName: string, description: string, module_name: string) =>
  Property.Dropdown({
    auth: biginAuth,
    displayName,
    description,
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return handleDropdownError('Please Connect your account first');
      try {
        const { accessToken, apiDomain } = getBiginConnection(auth);
        const resp = await biginApiService.fetchLayouts(accessToken, apiDomain, module_name);
        const layouts = toObjects(isObject(resp) ? resp['layouts'] : undefined);
        return {
          disabled: false,
          options: layouts.map((a) => ({ label: str(a['name']), value: JSON.stringify(a) })),
        };
      } catch {
        return handleDropdownError('Failed to load layouts');
      }
    },
  });

export const productsDropdown = Property.MultiSelectDropdown({
  auth: biginAuth,
  displayName: 'Associated Products',
  description: 'Provide a list of products associated with the record',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    try {
      const records = await biginRecords.listAll({
        connection: getBiginConnection(auth),
        module: 'Products',
        fields: 'Product_Name,Owner,Product_Code,Product_Category,Unit_Price,Description,Tag,Product_Active',
      });
      if (records.length === 0) {
        return handleDropdownError('No products found. Please add products first.');
      }
      return {
        disabled: false,
        options: records.map((a) => ({ label: str(a['Product_Name']) || str(a['id']), value: JSON.stringify(a) })),
      };
    } catch {
      return handleDropdownError('Failed to load products');
    }
  },
});

export const tagsDropdown = (module: string, defaultValue?: string[]) =>
  Property.MultiSelectDropdown({
    auth: biginAuth,
    displayName: 'Tags',
    description: `Select tags to associate with this module, "${module}".`,
    required: false,
    refreshers: ['auth'],
    defaultValue: defaultValue || [],
    options: async ({ auth }) => {
      if (!auth) return handleDropdownError('Please Connect your account first');
      try {
        const { accessToken, apiDomain } = getBiginConnection(auth);
        const resp = await biginApiService.fetchTags(accessToken, apiDomain, module);
        const tags = toObjects(isObject(resp) ? resp['tags'] : undefined);
        if (tags.length === 0) {
          return handleDropdownError('No tags found. Please add tags first.');
        }
        return {
          disabled: false,
          options: tags.map((a) => ({ label: str(a['name']), value: str(a['name']) })),
        };
      } catch (error) {
        return handleDropdownError(
          `Failed to load tags: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  });

export const SubPipelineorStageDropdown = (
  displayName: string,
  description: string,
  field_label: string,
  defaultValue?: string
) =>
  Property.Dropdown({
    auth: biginAuth,
    displayName,
    description,
    required: true,
    refreshers: ['auth', 'pipeline'],
    defaultValue,
    options: async ({ auth, pipeline }) => {
      if (!auth) return handleDropdownError('Please connect your account first');
      if (!pipeline) return handleDropdownError('Please select a Pipeline first');
      try {
        const { accessToken, apiDomain } = getBiginConnection(auth);
        const response = await biginApiService.fetchLayouts(accessToken, apiDomain, 'Pipelines');
        const layouts = toObjects(isObject(response) ? response['layouts'] : undefined);
        const pipelineId = parseJsonObject(pipeline)['id'];
        const layout = layouts.find((l) => l['id'] === pipelineId);
        if (!layout) return handleDropdownError('Pipeline not found');
        const field = findPipelineField({
          layout,
          apiName: field_label === 'Stage' ? 'Stage' : 'Sub_Pipeline',
          label: field_label,
        });
        const values = toObjects(field?.['pick_list_values']);
        return {
          disabled: false,
          options: values.map((pl) => ({ label: str(pl['display_value']), value: str(pl['actual_value']) })),
        };
      } catch {
        return handleDropdownError(`Failed to load ${field_label} values`);
      }
    },
  });

export const biginAiProps = {
  module: (description: string) =>
    Property.StaticDropdown({
      displayName: 'Module',
      description,
      required: true,
      options: { options: BIGIN_RECORD_MODULES },
    }),
  id: <R extends boolean>({ displayName, description, required }: { displayName: string; description: string; required: R }) =>
    Property.ShortText({ displayName, description, required }),
  text: <R extends boolean>({ displayName, description, required }: { displayName: string; description: string; required: R }) =>
    Property.ShortText({ displayName, description, required }),
  longText: <R extends boolean>({ displayName, description, required }: { displayName: string; description: string; required: R }) =>
    Property.LongText({ displayName, description, required }),
  ownerId: () =>
    Property.ShortText({
      displayName: 'Owner ID',
      description: 'Bigin user id to own the record. Resolve it with List Users (Agent).',
      required: false,
    }),
  tags: () =>
    Property.Array({
      displayName: 'Tags',
      description: 'Tag names to add. On update, existing tags are kept.',
      required: false,
    }),
  relatedModule: () =>
    Property.StaticDropdown({
      displayName: 'Related Module',
      description: 'Module of the record this activity is linked to. Set together with Related Record ID.',
      required: false,
      options: {
        options: [
          { label: 'Contacts', value: 'Contacts' },
          { label: 'Companies (Accounts)', value: 'Accounts' },
          { label: 'Pipelines (Deals)', value: 'Pipelines' },
        ],
      },
    }),
  relatedId: () =>
    Property.ShortText({
      displayName: 'Related Record ID',
      description: 'Id of the Contact, Company or Pipeline record this activity is linked to.',
      required: false,
    }),
  additionalFields: () =>
    Property.Json({
      displayName: 'Additional Fields',
      description: 'Extra Bigin fields as a JSON object of field API names to values (e.g. custom fields). Merged last, so these override the fields above.',
      required: false,
    }),
};
