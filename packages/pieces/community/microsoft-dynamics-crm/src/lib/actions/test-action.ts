import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { microsoftDynamicsCRMAuth } from '../..';
export const testAction = createAction({
  name: 'test_Action',
  displayName: 'Test Action',
  description: 'Test Action',
  auth: microsoftDynamicsCRMAuth,
  props: {},
  async run(context) {
    const request: HttpRequest = {
      url: 'https://orgac098933.crm.dynamics.com/api/data/v9.2/leads',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    const res = await httpClient.sendRequest(request);
    console.log(res);
    return res.body;
  },
});
