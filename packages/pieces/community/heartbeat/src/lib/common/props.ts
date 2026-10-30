import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from './client';

function idProp({ displayName, description, required }: IdPropParams) {
  return required
    ? Property.ShortText({ displayName, description, required: true })
    : Property.ShortText({ displayName, description, required: false });
}

function emailsProp({ displayName, description, required }: IdPropParams) {
  return required
    ? Property.Array({ displayName, description, required: true })
    : Property.Array({ displayName, description, required: false });
}

function idsProp({ displayName, description, required }: IdPropParams) {
  return required
    ? Property.Array({ displayName, description, required: true })
    : Property.Array({ displayName, description, required: false });
}

function limitProp({ max, defaultValue }: { max: number; defaultValue: number }) {
  return Property.Number({
    displayName: 'Limit',
    description: `How many items to return (1-${max}, default ${defaultValue}).`,
    required: false,
    defaultValue,
  });
}

function startingAfterProp() {
  return Property.ShortText({
    displayName: 'Starting After (Cursor)',
    description: 'Leave empty for the first page. To get the next page, pass the Next Cursor value from the previous run.',
    required: false,
  });
}

function richTextProp({ displayName, required }: { displayName: string; required: boolean }) {
  const description = `Plain text is sent as paragraphs (one per line). HTML is also supported: p, a, b, h1, h2, h3, ul, li and br (other tags are removed; text outside p, h1-h3 or ul blocks is dropped by Heartbeat). Mention a member or group with @ followed by their ID, for example @3f2b6c1e-8d4a-4f6b-9c1d-2e5a7b8c9d0e; mentioned people are notified.`;
  return required
    ? Property.LongText({ displayName, description, required: true })
    : Property.LongText({ displayName, description, required: false });
}

function authorProp({ displayName }: { displayName: string }) {
  return Property.ShortText({
    displayName,
    description: 'User ID of an admin to post as. Leave empty to post as the admin who created the API key. Use List Members to find admin IDs.',
    required: false,
  });
}

function triStateProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    defaultValue: 'unchanged',
    options: {
      disabled: false,
      options: [
        { label: 'Leave unchanged', value: 'unchanged' },
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

async function loadOptions({ token, path, operation }: { token: string; path: string; operation: string }) {
  try {
    const items = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token, method: HttpMethod.GET, path, operation }),
    );
    return {
      disabled: false,
      options: items.flatMap((item) =>
        typeof item['id'] === 'string' ? [{ label: String(item['name'] ?? item['id']), value: item['id'] }] : [],
      ),
    };
  } catch (error) {
    const status = heartbeatApi.statusOf(error);
    const reason = status === 401 || status === 403
      ? 'The API key was rejected. Reconnect with a valid key.'
      : status === 429
        ? 'Heartbeat rate limit reached. Try again in a few seconds.'
        : `Could not load options from Heartbeat${status ? ` (${status})` : ''}.`;
    return { disabled: true, options: [], placeholder: reason };
  }
}

const roleDropdown = Property.Dropdown({
  auth: heartbeatAuth,
  displayName: 'Roles',
  description: 'The role the user should have',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please select a connection first.' };
    }
    return loadOptions({ token: auth.secret_text, path: '/roles', operation: 'list roles' });
  },
});

const groupsDropdown = Property.MultiSelectDropdown({
  auth: heartbeatAuth,
  displayName: 'Groups',
  description: 'A list of the ids of the groups that the user should belong to.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please select a connection first.' };
    }
    return loadOptions({ token: auth.secret_text, path: '/groups', operation: 'list groups' });
  },
});

export const heartbeatProps = {
  id: idProp,
  ids: idsProp,
  emails: emailsProp,
  limit: limitProp,
  startingAfter: startingAfterProp,
  richText: richTextProp,
  author: authorProp,
  triState: triStateProp,
  roleDropdown,
  groupsDropdown,
};

type IdPropParams = { displayName: string; description: string; required: boolean };
