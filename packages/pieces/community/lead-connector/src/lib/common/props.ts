import { Property, tryCatch } from '@activepieces/pieces-framework';
import { leadConnectorAuth } from '../..';
import { getContacts, getPipelines, getUsers, LeadConnectorContact } from '.';

function contact<R extends boolean>({
  description,
  required,
}: {
  description?: string;
  required: R;
}) {
  return Property.Dropdown<string, R, typeof leadConnectorAuth>({
    auth: leadConnectorAuth,
    displayName: 'Contact',
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: CONNECT_FIRST,
        };
      }
      const contacts = await listContacts({
        auth,
        query: searchValue ? searchValue : undefined,
      });
      return {
        disabled: false,
        options: contacts.map((item) => ({
          label: contactLabel(item),
          value: item.id,
        })),
        placeholder: searchValue
          ? 'No contacts match this search'
          : 'No contacts found',
      };
    },
  });
}

function user<R extends boolean>({
  displayName,
  description,
  required,
}: {
  displayName: string;
  description?: string;
  required: R;
}) {
  return Property.Dropdown<string, R, typeof leadConnectorAuth>({
    auth: leadConnectorAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: CONNECT_FIRST,
        };
      }
      const users: LeadConnectorUser[] = await getUsers(auth);
      return {
        disabled: false,
        options: users.map((item) => ({
          label: userLabel(item),
          value: item.id,
        })),
        placeholder: 'No users found',
      };
    },
  });
}

function pipeline({ description }: { description?: string } = {}) {
  return Property.Dropdown({
    auth: leadConnectorAuth,
    displayName: 'Pipeline',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: CONNECT_FIRST,
        };
      }
      const pipelines: LeadConnectorPipeline[] = await getPipelines(auth);
      return {
        disabled: false,
        options: pipelines.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        placeholder: 'No pipelines found',
      };
    },
  });
}

async function listContacts({
  auth,
  query,
}: {
  auth: ContactsAuth;
  query?: string;
}): Promise<LeadConnectorContact[]> {
  const firstPage = await getContacts(auth, { query });
  if (query) {
    return firstPage;
  }
  const laterPages = await nextContactPages({
    auth,
    previous: firstPage,
    remaining: EXTRA_CONTACT_PAGES,
  });
  return [...firstPage, ...laterPages];
}

async function nextContactPages({
  auth,
  previous,
  remaining,
}: {
  auth: ContactsAuth;
  previous: LeadConnectorContact[];
  remaining: number;
}): Promise<LeadConnectorContact[]> {
  const last = previous[previous.length - 1];
  if (remaining === 0 || previous.length < CONTACTS_PAGE_SIZE || !last) {
    return [];
  }
  const { data: page } = await tryCatch(() =>
    getContacts(auth, { startAfterId: last.id })
  );
  const seen = new Set(previous.map((item) => item.id));
  const fresh = (page ?? []).filter((item) => !seen.has(item.id));
  if (fresh.length === 0) {
    return [];
  }
  const rest = await nextContactPages({
    auth,
    previous: fresh,
    remaining: remaining - 1,
  });
  return [...fresh, ...rest];
}

function contactLabel(item: LeadConnectorContact): string {
  const name =
    item.contactName ||
    [item.firstName, item.lastName].filter((part) => !!part).join(' ');
  const detail = item.email || item.phone;
  if (name && detail) {
    return `${name} (${detail})`;
  }
  return name || detail || item.id;
}

function userLabel(item: LeadConnectorUser): string {
  const name = [item.firstName, item.lastName]
    .filter((part) => !!part)
    .join(' ');
  if (name && item.email) {
    return `${name} (${item.email})`;
  }
  return name || item.email || item.id;
}

const CONTACTS_PAGE_SIZE = 100;
const EXTRA_CONTACT_PAGES = 4;
const CONNECT_FIRST = 'Connect your account first';

export const leadConnectorProps = {
  contact,
  user,
  pipeline,
};

type ContactsAuth = Parameters<typeof getContacts>[0];

type LeadConnectorUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type LeadConnectorPipeline = {
  id: string;
  name: string;
};
