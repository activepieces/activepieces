import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const getAccount = createAction({
  auth: lobstermailAuth,
  name: 'get_account',
  displayName: 'Get Account',
  description: 'Get account details including tier, limits, and usage',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/account`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
