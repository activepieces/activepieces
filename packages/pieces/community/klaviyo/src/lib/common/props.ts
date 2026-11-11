import { Property } from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from './auth';
import {
  equalsFilter,
  isRecord,
  KlaviyoCapError,
  klaviyoApi,
  KlaviyoResource,
  pathFor,
  textOf,
} from './client';

export async function listOptions({ auth, searchValue }: { auth: KlaviyoAuthValue | undefined; searchValue: string | undefined }): Promise<DropdownResult> {
  return groupOptions({ auth, searchValue, path: '/lists', what: 'lists' });
}

export async function segmentOptions({ auth, searchValue }: { auth: KlaviyoAuthValue | undefined; searchValue: string | undefined }): Promise<DropdownResult> {
  return groupOptions({ auth, searchValue, path: '/segments', what: 'segments' });
}

export async function metricOptions({ auth }: { auth: KlaviyoAuthValue | undefined }): Promise<DropdownResult> {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account', options: [] };
  }
  try {
    const { items } = await klaviyoApi.listAll({ auth, path: '/metrics', maxItems: MAX_DROPDOWN_ITEMS, what: 'metrics' });
    return {
      disabled: false,
      options: items.map((metric) => {
        const name = textOf(metric.attributes['name']) ?? metric.id;
        const integration = metric.attributes['integration'];
        const source = isRecord(integration) ? textOf(integration['name']) : undefined;
        return { label: source === undefined ? name : `${name} (${source})`, value: metric.id };
      }),
    };
  } catch (error) {
    return errorState(error);
  }
}

export function normalizePhone(value: string): string {
  const stripped = value.trim().replace(/[\s\-().]/g, '');
  return /^\d+$/.test(stripped) ? `+${stripped}` : stripped;
}

export function profileSearchFilter(searchValue: string): string {
  const text = searchValue.trim();
  if (text.includes('@')) {
    return equalsFilter({ field: 'email', value: text });
  }
  if (text.startsWith('+')) {
    return equalsFilter({ field: 'phone_number', value: normalizePhone(text) });
  }
  return equalsFilter({ field: 'id', value: text });
}

export const profileIdDropdown = Property.Dropdown({
  displayName: 'Profile Id',
  description: 'Shows the 100 newest profiles. Type an exact email, an E.164 phone number (starting with +) or a profile ID to find others.',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth'],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => profileOptions({ auth, searchValue }),
});

export const allProfileIdsMultiSelectDropdown = Property.MultiSelectDropdown({
  displayName: 'Profile Ids',
  description: 'Select one or more Klaviyo profiles. Shows the 100 newest; type an exact email, an E.164 phone number (starting with +) or a profile ID to find others.',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth'],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => profileOptions({ auth, searchValue }),
});

export const profileIdsMultiSelectDropdown = Property.MultiSelectDropdown({
  displayName: 'Profile Ids',
  description: 'Select one or more members of the chosen list. Shows the 100 most recently added; type an exact email to find others.',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth', 'list_id'],
  refreshOnSearch: true,
  options: async ({ auth, list_id }, { searchValue }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your account', options: [] };
    }
    const listId = textOf(list_id);
    if (listId === undefined) {
      return { disabled: true, placeholder: 'Select a list first', options: [] };
    }
    try {
      const search = textOf(searchValue?.trim());
      const page = await klaviyoApi.listPage({
        auth,
        path: `${pathFor(['lists', listId])}/profiles`,
        query: {
          'page[size]': 100,
          sort: '-joined_group_at',
          filter: search === undefined ? undefined : equalsFilter({ field: 'email', value: search }),
        },
      });
      return {
        disabled: false,
        placeholder: page.has_more ? 'Showing the 100 most recently added members. Type an exact email to find others.' : undefined,
        options: page.items.map(profileOption),
      };
    } catch (error) {
      return errorState(error);
    }
  },
});

export const listIdDropdown = Property.Dropdown({
  displayName: 'List Id',
  description: 'Select a list, or type its exact name to search.',
  required: true,
  auth: klaviyoAuth,
  refreshers: ['auth'],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => listOptions({ auth, searchValue }),
});

export const countryCode = Property.ShortText({
  displayName: 'Country Code',
  description:
    'Enter 2-letter ISO country code. Popular: US, GB, CA, DE, FR, AU, JP, CN, IN, BR',
  required: false,
});

const MAX_DROPDOWN_ITEMS = 1000;

async function profileOptions({ auth, searchValue }: { auth: KlaviyoAuthValue | undefined; searchValue: string | undefined }): Promise<DropdownResult> {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account', options: [] };
  }
  try {
    const search = textOf(searchValue?.trim());
    const page = await klaviyoApi.listPage({
      auth,
      path: '/profiles',
      query: search === undefined
        ? { 'page[size]': 100, sort: '-created' }
        : { 'page[size]': 100, filter: profileSearchFilter(search) },
    });
    return {
      disabled: false,
      placeholder: search === undefined ? 'Type an exact email to find others' : undefined,
      options: page.items.map(profileOption),
    };
  } catch (error) {
    return errorState(error);
  }
}

async function groupOptions({ auth, searchValue, path, what }: { auth: KlaviyoAuthValue | undefined; searchValue: string | undefined; path: string; what: string }): Promise<DropdownResult> {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account', options: [] };
  }
  const search = textOf(searchValue?.trim());
  try {
    const { items } = await klaviyoApi.listAll({
      auth,
      path,
      query: search === undefined ? undefined : { filter: equalsFilter({ field: 'name', value: search }) },
      maxItems: MAX_DROPDOWN_ITEMS,
      what,
    });
    return {
      disabled: false,
      options: items.map((item) => ({ label: textOf(item.attributes['name']) ?? item.id, value: item.id })),
    };
  } catch (error) {
    if (error instanceof KlaviyoCapError) {
      return {
        disabled: false,
        placeholder: `More than ${MAX_DROPDOWN_ITEMS} ${what}: type the exact name to find one.`,
        options: [],
      };
    }
    return errorState(error);
  }
}

function profileOption(profile: KlaviyoResource): { label: string; value: string } {
  const name = [textOf(profile.attributes['first_name']), textOf(profile.attributes['last_name'])].filter((part) => part !== undefined).join(' ');
  const contact = textOf(profile.attributes['email']) ?? textOf(profile.attributes['phone_number']);
  const label = name !== '' && contact !== undefined ? `${name} (${contact})` : name !== '' ? name : contact ?? profile.id;
  return { label, value: profile.id };
}

function errorState(error: unknown): DropdownResult {
  return {
    disabled: true,
    placeholder: error instanceof Error ? error.message.slice(0, 300) : 'Klaviyo request failed.',
    options: [],
  };
}

type DropdownResult = {
  disabled: boolean;
  placeholder?: string;
  options: { label: string; value: string }[];
};
