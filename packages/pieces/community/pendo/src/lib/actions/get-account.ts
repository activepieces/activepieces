import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';
import { pendoRequest } from '../common/client';

export const getAccount = createAction({
  auth: pendoAuth,
  name: 'get_account',
  displayName: 'Get Account Details',
  description: 'Retrieve details of an account by its ID.',
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'The unique identifier for the account.',
      required: true,
    }),
  },
  async run(context) {
    const { accountId } = context.propsValue;
    return await pendoRequest(
      String(context.auth),
      HttpMethod.GET,
      `/account/${encodeURIComponent(accountId)}`,
    );
  },
});
