import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { BASE_URL } from './constants';
import { ChaindeskNamedEntity } from './types';
import { chaindeskAuth } from './auth';

export const agentIdDropdown = Property.Dropdown({
  displayName: 'Agent',
  auth: chaindeskAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) =>
    loadOptions({ token: auth?.secret_text, path: '/agents', noun: 'agents' }),
});

export const optionalAgentIdDropdown = Property.Dropdown({
  displayName: 'Agent',
  description: 'Only return conversations of this agent. Leave empty for all.',
  auth: chaindeskAuth,
  refreshers: [],
  required: false,
  options: async ({ auth }) =>
    loadOptions({ token: auth?.secret_text, path: '/agents', noun: 'agents' }),
});

export const datastoreIdDropdown = Property.Dropdown({
  displayName: 'Datastore',
  refreshers: [],
  required: true,
  auth: chaindeskAuth,
  options: async ({ auth }) =>
    loadOptions({
      token: auth?.secret_text,
      path: '/datastores',
      noun: 'datastores',
    }),
});

async function loadOptions({
  token,
  path,
  noun,
}: {
  token: string | undefined;
  path: string;
  noun: string;
}) {
  if (!token) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please connect your account first.',
    };
  }
  try {
    const response = await httpClient.sendRequest<ChaindeskNamedEntity[]>({
      method: HttpMethod.GET,
      url: BASE_URL + path,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    });
    if (!Array.isArray(response.body)) {
      throw new Error(`Unexpected ${noun} response`);
    }
    const items = response.body;
    return {
      disabled: false,
      options: items.map((item) => ({
        label: item.name,
        value: item.id,
      })),
      placeholder: items.length === 0 ? `No ${noun} found.` : undefined,
    };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: `Could not load ${noun}. Check your connection.`,
    };
  }
}
