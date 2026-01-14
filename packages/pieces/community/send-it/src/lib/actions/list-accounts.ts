import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import { sendItRequest } from '../common';

export const listAccounts = createAction({
  auth: sendItAuth,
  name: 'list_accounts',
  displayName: 'List Connected Accounts',
  description: 'Get a list of connected social media accounts',
  props: {},
  async run(context) {
    return await sendItRequest(
      context.auth,
      HttpMethod.GET,
      '/accounts'
    );
  },
});
