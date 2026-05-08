import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';

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
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://app.pendo.io/api/v1/account/${encodeURIComponent(
        accountId
      )}`,
      headers: {
        'x-pendo-integration-key': context.auth.secret_text,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
