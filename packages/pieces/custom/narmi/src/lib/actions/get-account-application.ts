import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { narmiAuth } from '../..';

export const getAccountApplication = createAction({
  name: 'get_account_application',
  auth: narmiAuth,
  displayName: 'Get Account Application',
  description: 'Get an account application by UUID',
  props: {
    uuid: Property.ShortText({
      displayName: 'Application UUID',
      description: 'The UUID of the account application',
      required: true,
    }),
    csrfToken: Property.ShortText({
      displayName: 'CSRF Token',
      description: 'CSRF token obtained from GET /csrf endpoint',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { uuid, csrfToken } = context.propsValue;

    const headers: Record<string, string> = {
      'accept': 'application/json',
    };

    if (csrfToken) {
      headers['X-CSRFTOKEN'] = csrfToken;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/v1/account_opening/${uuid}/`,
      headers,
    });

    return response.body;
  },
});
