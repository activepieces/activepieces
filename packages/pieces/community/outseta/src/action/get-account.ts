import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getAccountAction = createAction({
  name: 'get_account',
  auth: outsetaAuth,
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
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
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
