import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const listInboxes = createAction({
  auth: lobstermailAuth,
  name: 'list_inboxes',
  displayName: 'List Inboxes',
  description: 'List all email inboxes on the account',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
