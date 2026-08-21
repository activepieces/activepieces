import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from './auth';
import { famulorRequest, unwrapList } from './client';

function disabled(placeholder: string) {
  return {
    disabled: true,
    options: [] as { label: string; value: string }[],
    placeholder,
  };
}

export function assistantDropdown(required = true) {
  return Property.Dropdown({
    auth: famulorAuth,
    displayName: 'Assistant',
    description: 'Select the AI assistant by name',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabled('Please connect your account first');
      }
      try {
        const body = await famulorRequest({
          auth,
          method: HttpMethod.GET,
          path: '/assistants',
          queryParams: { limit: '200' },
        });
        const assistants = unwrapList(body, ['assistants', 'data', 'rows']);
        if (assistants.length === 0) {
          return disabled('No assistants found. Create one in Famulor first.');
        }
        return {
          disabled: false,
          options: assistants.map((assistant) => {
            const name = typeof assistant['name'] === 'string' ? assistant['name'] : 'Untitled';
            const active = assistant['is_active'] === false ? 'inactive' : 'active';
            return {
              label: `${name} (${active})`,
              value: String(assistant['id'] ?? ''),
            };
          }).filter((option) => option.value !== ''),
        };
      } catch {
        return disabled('Failed to load assistants. Check your connection.');
      }
    },
  });
}

export function campaignDropdown(required = false) {
  return Property.Dropdown({
    auth: famulorAuth,
    displayName: 'Campaign',
    description: 'Optionally filter by campaign',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabled('Please connect your account first');
      }
      try {
        const body = await famulorRequest({
          auth,
          method: HttpMethod.GET,
          path: '/campaigns',
          queryParams: { limit: '200' },
        });
        const campaigns = unwrapList(body, ['campaigns', 'data', 'rows']);
        if (campaigns.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No campaigns found. Create one first.',
          };
        }
        return {
          disabled: false,
          options: campaigns.map((campaign) => {
            const name = typeof campaign['name'] === 'string' ? campaign['name'] : 'Untitled';
            const status = typeof campaign['status'] === 'string' ? campaign['status'] : 'unknown';
            return {
              label: `${name} (${status})`,
              value: String(campaign['id'] ?? ''),
            };
          }).filter((option) => option.value !== ''),
        };
      } catch {
        return disabled('Failed to load campaigns. Check your connection.');
      }
    },
  });
}

export function phoneNumberDropdown(required = false) {
  return Property.Dropdown({
    auth: famulorAuth,
    displayName: 'From phone number',
    description:
      'Optional caller ID. Leave empty to use the number already assigned to the assistant.',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabled('Please connect your account first');
      }
      try {
        const body = await famulorRequest({
          auth,
          method: HttpMethod.GET,
          path: '/phone_numbers',
          queryParams: { limit: '200' },
        });
        const numbers = unwrapList(body, ['phone_numbers', 'rows', 'data']);
        if (numbers.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No phone numbers found. The assistant default number will be used.',
          };
        }
        return {
          disabled: false,
          options: numbers.map((number) => {
            const e164 =
              (typeof number['number'] === 'string' && number['number']) ||
              (typeof number['phone_number'] === 'string' && number['phone_number']) ||
              '';
            const label = typeof number['label'] === 'string' && number['label']
              ? `${e164} (${number['label']})`
              : e164;
            return {
              label: label || String(number['id'] ?? ''),
              value: String(number['id'] ?? ''),
            };
          }).filter((option) => option.value !== ''),
        };
      } catch {
        return {
          disabled: false,
          options: [],
          placeholder: 'Could not load phone numbers. Leave empty to use the assistant default.',
        };
      }
    },
  });
}

export function callDropdown() {
  return Property.Dropdown({
    auth: famulorAuth,
    displayName: 'Call',
    description: 'Select a recent call',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabled('Please connect your account first');
      }
      try {
        const body = await famulorRequest({
          auth,
          method: HttpMethod.GET,
          path: '/calls',
          queryParams: { limit: '50' },
        });
        const calls = unwrapList(body, ['calls', 'data', 'rows']);
        if (calls.length === 0) {
          return disabled('No calls found yet.');
        }
        return {
          disabled: false,
          options: calls.map((call) => {
            const to =
              typeof call['to_number'] === 'string' && call['to_number']
                ? call['to_number']
                : 'unknown number';
            const status = typeof call['status'] === 'string' ? call['status'] : 'unknown';
            const created =
              typeof call['created_at'] === 'string' ? call['created_at'] : '';
            return {
              label: created ? `${to} · ${status} · ${created}` : `${to} · ${status}`,
              value: String(call['id'] ?? ''),
            };
          }).filter((option) => option.value !== ''),
        };
      } catch {
        return disabled('Failed to load calls. Check your connection.');
      }
    },
  });
}

export const e164PhoneProperty = Property.ShortText({
  displayName: 'Phone number to call',
  description: 'Destination number in E.164 format, for example +4930123456',
  required: true,
});
