import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCashAccount } from '../common';

export const listCashAccounts = createAction({
  auth: brexAuth,
  name: 'list_cash_accounts',
  displayName: 'List Cash Accounts',
  description: 'List all Brex Cash accounts with their balances and status.',
  props: {},
  async run(context) {
    const response = await brexCommon.apiCall<{ items: BrexCashAccount[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/accounts/cash',
    });
    return response.body.items.map(brexCommon.flattenCashAccount);
  },
});
