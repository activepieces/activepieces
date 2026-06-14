import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import { sendItRequest } from '../common';

export const listAccounts = createAction({
  auth: sendItAuth,
  name: 'list_accounts',
  displayName: 'List Connected Accounts',
  description: 'Get a list of connected social media accounts',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the social media accounts currently connected to the SendIt account. Use this to discover which platforms are available before publishing or scheduling, or to verify a connection exists. Takes no input. Idempotent: it is a read-only lookup.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await sendItRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      '/accounts'
    );
  },
});
