import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from './api';
import { helpScoutAuth } from './auth';

function stringOf(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function personLabel(item: Record<string, unknown>): string {
  const name = `${stringOf(item['firstName'])} ${stringOf(item['lastName'])}`.trim();
  const email = stringOf(item['email']) || embeddedEmail(item);
  if (name && email) {
    return `${name} (${email})`;
  }
  return name || email || stringOf(item['id']);
}

function embeddedEmail(item: Record<string, unknown>): string {
  const embedded = item['_embedded'];
  if (!helpScoutApi.isRecord(embedded) || !Array.isArray(embedded['emails'])) {
    return '';
  }
  const first = embedded['emails'].find(helpScoutApi.isRecord);
  return first ? stringOf(first['value']) : '';
}

function conversationLabel(item: Record<string, unknown>): string {
  const subject = stringOf(item['subject']) || '(no subject)';
  const number = stringOf(item['number']);
  const customer = item['primaryCustomer'];
  const email = helpScoutApi.isRecord(customer) ? stringOf(customer['email']) : '';
  const prefix = number ? `#${number} ` : '';
  return email ? `${prefix}${subject} - ${email}` : `${prefix}${subject}`;
}

async function loadOptions({
  auth,
  path,
  embedKey,
  label,
  queryParams,
  searchValue,
  limit = DROPDOWN_LIMIT,
}: {
  auth: { access_token: string } | undefined;
  path: string;
  embedKey: string;
  label: (item: Record<string, unknown>) => string;
  queryParams?: Record<string, string>;
  searchValue?: unknown;
  limit?: number;
}) {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
  }
  try {
    const search = typeof searchValue === 'string' ? searchValue.replace(/"/g, '').trim() : '';
    const { items, truncated } = await helpScoutApi.fetchPaged({
      auth,
      path,
      embedKey,
      queryParams: search ? { ...queryParams, query: search } : queryParams,
      limit,
    });
    const options = items
      .filter((item) => stringOf(item['id']).length > 0)
      .map((item) => ({ label: label(item), value: stringOf(item['id']) }));
    return {
      disabled: false,
      options,
      placeholder:
        truncated && !search
          ? `Showing the newest ${limit} - type to search for older records.`
          : undefined,
    };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: 'Could not load options from Help Scout. Check the connection and try again.',
    };
  }
}

export const customerIdDropdown = Property.Dropdown({
  displayName: 'Customer',
  refreshers: [],
  auth: helpScoutAuth,
  required: true,
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) =>
    loadOptions({
      auth,
      path: '/customers',
      embedKey: 'customers',
      label: personLabel,
      searchValue,
      limit: SEARCHABLE_DROPDOWN_LIMIT,
    }),
});

export const userIdDropdown = (displayName: string) =>
  Property.Dropdown({
    displayName,
    refreshers: [],
    auth: helpScoutAuth,
    required: false,
    options: async ({ auth }) =>
      loadOptions({ auth, path: '/users', embedKey: 'users', label: personLabel }),
  });

export const conversationIdDropdown = Property.Dropdown({
  displayName: 'Conversation',
  refreshers: [],
  required: false,
  auth: helpScoutAuth,
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) =>
    loadOptions({
      auth,
      searchValue,
      path: '/conversations',
      embedKey: 'conversations',
      label: conversationLabel,
      queryParams: { status: 'all', sortField: 'modifiedAt', sortOrder: 'desc' },
      limit: SEARCHABLE_DROPDOWN_LIMIT,
    }),
});

export const mailboxIdDropdown = (required = true) =>
  Property.Dropdown({
    displayName: 'Mailbox',
    refreshers: [],
    required,
    auth: helpScoutAuth,
    options: async ({ auth }) =>
      loadOptions({
        auth,
        path: '/mailboxes',
        embedKey: 'mailboxes',
        label: (item) => stringOf(item['name']) || stringOf(item['id']),
      }),
  });

export const customerProperties = Property.DynamicProperties({
  displayName: 'Customer Properties',
  refreshers: [],
  required: true,
  auth: helpScoutAuth,
  props: async ({ auth }) => {
    if (!auth) return {};
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: '/customer-properties',
      auth,
    });
    const definitions = helpScoutApi.getEmbeddedList({
      body: response.body,
      key: 'customer-properties',
    });
    const props: DynamicPropsValue = {};
    for (const field of definitions) {
      const slug = stringOf(field['slug']);
      const name = stringOf(field['name']) || slug;
      if (!slug) continue;
      switch (field['type']) {
        case 'text':
        case 'url':
          props[slug] = Property.ShortText({ displayName: name, required: false });
          break;
        case 'number':
          props[slug] = Property.Number({ displayName: name, required: false });
          break;
        case 'date':
          props[slug] = Property.ShortText({
            displayName: name,
            description: 'Provide date in YYYY-MM-DD format.',
            required: false,
          });
          break;
        case 'dropdown': {
          const options = Array.isArray(field['options'])
            ? field['options'].filter(helpScoutApi.isRecord)
            : [];
          props[slug] = Property.StaticDropdown({
            displayName: name,
            required: false,
            options: {
              disabled: false,
              options: options.map((option) => ({
                label: stringOf(option['label']),
                value: stringOf(option['label']),
              })),
            },
          });
          break;
        }
      }
    }
    return props;
  },
});

const DROPDOWN_LIMIT = 500;
const SEARCHABLE_DROPDOWN_LIMIT = 100;
