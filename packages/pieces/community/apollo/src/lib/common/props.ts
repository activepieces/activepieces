import { DropdownOption, DropdownState, Property } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { ApolloRecord, apiKeyOf, errorText, isRecord, recordsOf } from './client';
import { apolloRequests } from './requests';

function contactStage({ required }: { required: boolean }) {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName: 'Contact Stage',
    description: 'Contact stage from your Apollo workspace.',
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'contact stages',
        load: async (apiKey) => recordsOf((await apolloRequests.listContactStages({ apiKey }))['contact_stages']).map((stage) => ({ label: String(stage['display_name'] ?? stage['name'] ?? stage['id']), value: String(stage['id']) })),
      }),
  });
}

function accountStage({ required }: { required: boolean }) {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName: 'Account Stage',
    description: 'Account stage from your Apollo workspace.',
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'account stages',
        load: async (apiKey) => recordsOf((await apolloRequests.listAccountStages({ apiKey }))['account_stages']).map((stage) => ({ label: String(stage['display_name'] ?? stage['name'] ?? stage['id']), value: String(stage['id']) })),
      }),
  });
}

function dealStage({ required }: { required: boolean }) {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName: 'Deal Stage',
    description: 'Deal stage from your Apollo deal pipelines.',
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'deal stages',
        load: async (apiKey) => recordsOf((await apolloRequests.listDealStages({ apiKey }))['opportunity_stages']).map((stage) => ({ label: String(stage['name'] ?? stage['id']), value: String(stage['id']) })),
      }),
  });
}

function owner({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'users',
        load: async (apiKey) => {
          const users = await collectPages({ fetchPage: async (page) => (await apolloRequests.listUsers({ apiKey, page, perPage: 100 })), key: 'users' });
          return users.filter((user) => user['deleted'] !== true).map((user) => ({ label: userLabel(user), value: String(user['id']) }));
        },
      }),
  });
}

function sequence() {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName: 'Sequence',
    description: 'Sequence to add the contacts to. Type to search by name.',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) =>
      loadOptions({
        auth,
        what: 'sequences',
        load: async (apiKey) => {
          const response = await apolloRequests.searchSequences({ apiKey, query: { q_name: searchValue, page: 1, per_page: 100 } });
          return { options: recordsOf(response['emailer_campaigns']).map((item) => ({ label: `${String(item['name'] ?? item['id'])}${item['active'] === true ? '' : ' (inactive)'}`, value: String(item['id']) })), total: totalOf(response) };
        },
      }),
  });
}

function emailAccount() {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName: 'Send From Mailbox',
    description: 'Connected mailbox the sequence emails are sent from.',
    required: true,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'mailboxes',
        load: async (apiKey) =>
          recordsOf((await apolloRequests.listEmailAccounts({ apiKey }))['email_accounts']).map((item) => ({ label: `${String(item['email'] ?? item['id'])}${item['active'] === false ? ' (inactive)' : ''}`, value: String(item['id']) })),
      }),
  });
}

function contact({ required, description }: { required: boolean; description: string }) {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName: 'Contact',
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => contactOptions({ auth, searchValue }),
  });
}

function contacts() {
  return Property.MultiSelectDropdown({
    auth: apolloAuth,
    displayName: 'Contacts',
    description: 'Contacts to add. Type a name or email to search; you can also map contact IDs.',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => contactOptions({ auth, searchValue }),
  });
}

function account({ required, description }: { required: boolean; description: string }) {
  return Property.Dropdown({
    auth: apolloAuth,
    displayName: 'Account',
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) =>
      loadOptions({
        auth,
        what: 'accounts',
        load: async (apiKey) => {
          const response = await apolloRequests.searchAccounts({ apiKey, body: { q_organization_name: searchValue, page: 1, per_page: 100, sort_by_field: 'account_updated_at', sort_ascending: false } });
          return { options: recordsOf(response['accounts']).map((item) => ({ label: `${String(item['name'] ?? item['id'])}${typeof item['domain'] === 'string' ? ` (${item['domain']})` : ''}`, value: String(item['id']) })), total: totalOf(response) };
        },
      }),
  });
}

function lists({ modality }: { modality: 'contacts' | 'accounts' }) {
  return Property.MultiSelectDropdown({
    auth: apolloAuth,
    displayName: 'Lists',
    description: `Existing ${modality} lists to add the record to.`,
    required: false,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'lists',
        load: async (apiKey) =>
          (await apolloRequests.listLists({ apiKey }))
            .filter((item) => item['modality'] === modality)
            .map((item) => ({ label: String(item['name'] ?? item['id']), value: String(item['name'] ?? '') }))
            .filter((option) => option.value !== ''),
      }),
  });
}

function taskType() {
  return Property.StaticDropdown<string>({
    displayName: 'Task Type',
    required: true,
    options: { disabled: false, options: TASK_TYPES },
  });
}

function taskPriority() {
  return Property.StaticDropdown<string>({
    displayName: 'Priority',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    },
  });
}

function sequenceStatus() {
  return Property.StaticDropdown<string>({
    displayName: 'Initial Status',
    description: 'Active starts the sequence right away and can send real emails. Paused adds the contacts without sending.',
    required: true,
    defaultValue: 'paused',
    options: {
      disabled: false,
      options: [
        { label: 'Paused (no emails until resumed)', value: 'paused' },
        { label: 'Active (starts sending)', value: 'active' },
      ],
    },
  });
}

function customFields({ modality }: { modality: string }) {
  return Property.Json({
    displayName: 'Custom Field Values',
    description: `Optional JSON object mapping ${modality} custom field IDs to values. Picklist fields take option IDs, not labels. Find field IDs in Apollo under Settings > Objects & Fields.`,
    required: false,
  });
}

async function contactOptions({ auth, searchValue }: { auth: unknown; searchValue: string | undefined }): Promise<DropdownState<string>> {
  return loadOptions({
    auth,
    what: 'contacts',
    load: async (apiKey) => {
      const response = await apolloRequests.searchContacts({ apiKey, body: { q_keywords: searchValue, page: 1, per_page: 100, sort_by_field: 'contact_updated_at', sort_ascending: false } });
      return { options: recordsOf(response['contacts']).map((item) => ({ label: contactLabel(item), value: String(item['id']) })), total: totalOf(response) };
    },
  });
}

async function loadOptions({ auth, what, load }: { auth: unknown; what: string; load: (apiKey: string) => Promise<DropdownOption<string>[] | SearchedOptions> }): Promise<DropdownState<string>> {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your Apollo account first.', options: [] };
  }
  try {
    const loaded = await load(apiKeyOf(auth));
    const options = Array.isArray(loaded) ? loaded : loaded.options;
    const total = Array.isArray(loaded) ? undefined : loaded.total;
    if (options.length === 0) {
      return { disabled: false, placeholder: `No ${what} found in Apollo.`, options };
    }
    return { disabled: false, placeholder: total !== undefined && total > options.length ? `Showing ${options.length} of ${total} ${what}. Type to search.` : undefined, options };
  } catch (error) {
    return { disabled: true, placeholder: `Could not load ${what}: ${errorText(error)}`, options: [] };
  }
}

async function collectPages({ fetchPage, key }: { fetchPage: (page: number) => Promise<ApolloRecord>; key: string }): Promise<ApolloRecord[]> {
  const pages: ApolloRecord[][] = [];
  for (let page = 1; page <= MAX_DROPDOWN_PAGES; page++) {
    const response = await fetchPage(page);
    const items = recordsOf(response[key]);
    pages.push(items);
    const pagination = isRecord(response['pagination']) ? response['pagination'] : {};
    const totalPages = Number(pagination['total_pages']);
    if (items.length < 100 || (Number.isFinite(totalPages) && page >= totalPages)) {
      return pages.flat();
    }
  }
  throw new Error(`more than ${MAX_DROPDOWN_PAGES * 100} ${key}; map the ID instead`);
}

function totalOf(response: ApolloRecord): number | undefined {
  const pagination = isRecord(response['pagination']) ? response['pagination'] : {};
  const total = Number(pagination['total_entries']);
  return Number.isFinite(total) ? total : undefined;
}

function userLabel(user: ApolloRecord): string {
  const name = typeof user['name'] === 'string' && user['name'].trim() !== '' ? user['name'] : [user['first_name'], user['last_name']].filter((part) => typeof part === 'string').join(' ');
  return name.trim() === '' ? String(user['email'] ?? user['id']) : `${name}${typeof user['email'] === 'string' ? ` (${user['email']})` : ''}`;
}

function contactLabel(item: ApolloRecord): string {
  const name = typeof item['name'] === 'string' && item['name'].trim() !== '' ? item['name'] : String(item['id']);
  return typeof item['email'] === 'string' ? `${name} (${item['email']})` : name;
}

const MAX_DROPDOWN_PAGES = 10;

export const apolloProps = {
  contactStage,
  accountStage,
  dealStage,
  owner,
  sequence,
  emailAccount,
  contact,
  contacts,
  account,
  lists,
  taskType,
  taskPriority,
  sequenceStatus,
  customFields,
};


type SearchedOptions = { options: DropdownOption<string>[]; total: number | undefined };

const TASK_TYPES = [
  { label: 'Call', value: 'call' },
  { label: 'Manual Email', value: 'outreach_manual_email' },
  { label: 'LinkedIn: Send Connection Request', value: 'linkedin_step_connect' },
  { label: 'LinkedIn: Send Message', value: 'linkedin_step_message' },
  { label: 'LinkedIn: View Profile', value: 'linkedin_step_view_profile' },
  { label: 'LinkedIn: Interact with Post', value: 'linkedin_step_interact_post' },
  { label: 'Action Item', value: 'action_item' },
];
