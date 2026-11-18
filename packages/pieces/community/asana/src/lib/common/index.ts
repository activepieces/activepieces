import { DropdownState, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { asanaAuth } from '../auth';
import { AsanaAuth, AsanaNamedRecord, AsanaPage, AsanaQuery, asanaClient } from './client';

const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const NOT_CONNECTED_PLACEHOLDER = 'Please connect your account first';
const NO_WORKSPACE_PLACEHOLDER = 'Please select a workspace first';

export const asanaCommon = {
  workspace: Property.Dropdown({
    auth: asanaAuth,
    description: 'Workspace the task is created in.',
    displayName: 'Workspace',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledState(NOT_CONNECTED_PLACEHOLDER);
      }
      const connection: AsanaAuth = { access_token: auth.access_token };
      return loadOptions({
        load: () =>
          listAllPages<AsanaNamedRecord>({
            auth: connection,
            path: '/workspaces',
            operation: 'List Workspaces',
          }),
        toOption: toNamedOption,
        emptyPlaceholder: 'No workspaces found.',
        errorPlaceholder: 'Failed to load workspaces. Check your connection.',
      });
    },
  }),
  project: Property.Dropdown({
    auth: asanaAuth,
    description: 'Project the task is added to. Archived projects are not listed.',
    displayName: 'Project',
    required: true,
    refreshers: ['workspace'],
    options: async ({ auth, workspace }) => {
      if (!auth) {
        return disabledState(NOT_CONNECTED_PLACEHOLDER);
      }
      if (!workspace) {
        return disabledState(NO_WORKSPACE_PLACEHOLDER);
      }
      const connection: AsanaAuth = { access_token: auth.access_token };
      return loadOptions({
        load: () =>
          listAllPages<AsanaNamedRecord>({
            auth: connection,
            path: '/projects',
            query: { workspace: String(workspace), archived: false, opt_fields: 'name' },
            operation: 'List Projects',
          }),
        toOption: toNamedOption,
        emptyPlaceholder: 'No projects found in this workspace.',
        errorPlaceholder: 'Failed to load projects. Check your connection.',
      });
    },
  }),
  assignee: Property.Dropdown<string, false, typeof asanaAuth>({
    auth: asanaAuth,
    description: 'Leave empty to keep the task unassigned.',
    displayName: 'Assignee',
    required: false,
    refreshers: ['workspace'],
    options: async ({ auth, workspace }) => {
      if (!auth) {
        return disabledState(NOT_CONNECTED_PLACEHOLDER);
      }
      if (!workspace) {
        return disabledState(NO_WORKSPACE_PLACEHOLDER);
      }
      const connection: AsanaAuth = { access_token: auth.access_token };
      return loadOptions({
        load: () =>
          listAllPages<AsanaUserRecord>({
            auth: connection,
            path: '/users',
            query: { workspace: String(workspace), opt_fields: 'name,email' },
            operation: 'List Users',
          }),
        toOption: toUserOption,
        emptyPlaceholder: 'No users found in this workspace.',
        errorPlaceholder: 'Failed to load users. Check your connection.',
      });
    },
  }),
  tags: Property.MultiSelectDropdown<string, false, typeof asanaAuth>({
    auth: asanaAuth,
    description: 'Pick tags, or type the names of existing tags.',
    displayName: 'Tags',
    required: false,
    refreshers: ['workspace'],
    options: async ({ auth, workspace }) => {
      if (!auth) {
        return disabledState(NOT_CONNECTED_PLACEHOLDER);
      }
      if (!workspace) {
        return disabledState(NO_WORKSPACE_PLACEHOLDER);
      }
      const connection: AsanaAuth = { access_token: auth.access_token };
      return loadOptions({
        load: () =>
          listAllPages<AsanaNamedRecord>({
            auth: connection,
            path: '/tags',
            query: { workspace: String(workspace), opt_fields: 'name' },
            operation: 'List Tags',
          }),
        toOption: toNamedOption,
        emptyPlaceholder: 'No tags found in this workspace.',
        errorPlaceholder: 'Failed to load tags. Check your connection.',
      });
    },
  }),
};

export async function callAsanaApi<T extends HttpMessageBody>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: unknown
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://app.asana.com/api/1.0/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: body,
  });
}

async function listAllPages<T>({
  auth,
  path,
  query,
  operation,
}: {
  auth: AsanaAuth;
  path: string;
  query?: AsanaQuery;
  operation: string;
}): Promise<T[]> {
  const records: T[] = [];
  let offset: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result: AsanaPage<T> = await asanaClient.asanaListPage<T>({
      auth,
      path,
      query,
      limit: PAGE_SIZE,
      offset,
      operation,
    });
    records.push(...result.data);
    offset = result.next_offset;
    if (offset === null) {
      break;
    }
  }
  return records;
}

async function loadOptions<T>({
  load,
  toOption,
  emptyPlaceholder,
  errorPlaceholder,
}: {
  load: () => Promise<T[]>;
  toOption: (record: T) => { label: string; value: string };
  emptyPlaceholder: string;
  errorPlaceholder: string;
}): Promise<DropdownState<string>> {
  try {
    const records = await load();
    if (records.length === 0) {
      return { disabled: false, options: [], placeholder: emptyPlaceholder };
    }
    return {
      disabled: false,
      options: records.map(toOption),
    };
  } catch {
    return disabledState(errorPlaceholder);
  }
}

function disabledState(placeholder: string): DropdownState<string> {
  return {
    disabled: true,
    options: [],
    placeholder,
  };
}

function toNamedOption(record: AsanaNamedRecord): { label: string; value: string } {
  return {
    label: record.name ?? record.gid,
    value: record.gid,
  };
}

function toUserOption(user: AsanaUserRecord): { label: string; value: string } {
  const name = user.name ?? user.gid;
  const hasEmail = typeof user.email === 'string' && user.email.trim() !== '';
  return {
    label: hasEmail ? `${name} (${user.email})` : name,
    value: user.gid,
  };
}

type AsanaUserRecord = AsanaNamedRecord & {
  email?: string | null;
};
