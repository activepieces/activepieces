import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const listAccountsAction = createAction({
  name: 'list_accounts',
  auth: outsetaAuth,
  displayName: 'List Accounts',
  description: 'Retrieve a paginated list of accounts from your Outseta CRM.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 100,
      description: 'Maximum number of accounts to return (default 100).',
    }),
    offset: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 0,
      description: 'Page number to fetch (0 = first page, 1 = second page, ...). Outseta uses page-based pagination, not record-based.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const limit = context.propsValue.limit ?? 100;
    const offset = context.propsValue.offset ?? 0;

    const result = await client.get<any>(
      `/api/v1/crm/accounts?limit=${limit}&offset=${offset}`
    );

    return result;
  },
});
