import { createAction, Property } from '@activepieces/pieces-framework';
import { OutsetaClient } from '../common/client';

export const getAccountAction = createAction({
  name: 'get_account',
  displayName: 'Get account',
  description: 'Retrieve an Outseta account by its UID',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.domain,
      apiKey: context.auth.apiKey,
      apiSecret: context.auth.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`
    );

    return {
      accountUid: context.propsValue.accountUid,
      account,
      rawResponse: account,
    };
  },
});
