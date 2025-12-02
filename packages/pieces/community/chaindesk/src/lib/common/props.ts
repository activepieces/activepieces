import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { BASE_URL } from './constants';
import { ListAgentsResponse } from './types';

export const agentIdDropdown = Property.Dropdown({
  displayName: 'Agent ID',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await httpClient.sendRequest<Array<ListAgentsResponse>>({
      method: HttpMethod.GET,
      url: BASE_URL + '/agents',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return {
      disabled: false,
      options: response.body.map((agent) => ({
        label: agent.name,
        value: agent.id,
      })),
    };
  },
});

export const datastoreIdDropdown = Property.Dropdown({
  displayName: 'Datastore ID',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await httpClient.sendRequest<Array<ListAgentsResponse>>({
      method: HttpMethod.GET,
      url: BASE_URL + '/datastores',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return {
      disabled: false,
      options: response.body.map((agent) => ({
        label: agent.name,
        value: agent.id,
      })),
    };
  },
});
