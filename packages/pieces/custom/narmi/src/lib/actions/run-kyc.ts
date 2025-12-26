import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { narmiAuth } from '../..';

export const runKyc = createAction({
  name: 'run_kyc',
  auth: narmiAuth,
  displayName: 'Run KYC',
  description: 'Initiate KYC execution for an account application',
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
      'Content-Type': 'application/json',
    };

    if (csrfToken) {
      headers['X-CSRFTOKEN'] = csrfToken;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/v1/account_opening/${uuid}/kyc/`,
      headers,
      body: {},
    });

    return response.body;
  },
});
