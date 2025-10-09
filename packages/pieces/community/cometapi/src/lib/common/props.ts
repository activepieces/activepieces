import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { BASE_URL } from './auth';

export const modelIdDropdown = Property.Dropdown({
  displayName: 'Model',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        placeholder: 'Please connect your account first.',
        disabled: true,
        options: [],
      };
    }

    const response = await httpClient.sendRequest<{
      data: Array<{ id: string; owned_by: string }>;
    }>({
      url: BASE_URL + '/models',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      method: HttpMethod.GET,
    });

    return {
      disabled: false,
      options: response.body.data.map((model) => ({
        label: `${model.id} (${model.owned_by})`,
        value: model.id,
      })),
    };
  },
});
