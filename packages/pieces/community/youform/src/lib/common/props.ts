import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { BASE_URL } from './constants';
import { ListFormsResponse } from './types';

export const formIdDropdown = Property.Dropdown({
  displayName: 'Form',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        placeholder: 'Please connect your account first.',
        options: [],
        disabled: false,
      };
    }

    const response = await httpClient.sendRequest<ListFormsResponse>({
      method: HttpMethod.GET,
      url: BASE_URL + '/forms',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return {
      disabled: false,
      options: response.body.data.data.map((form) => ({
        label: form.name,
        value: form.slug,
      })),
    };
  },
});
