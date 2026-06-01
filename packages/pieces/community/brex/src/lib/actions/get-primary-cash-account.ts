import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCashAccount } from '../common';

export const getPrimaryCashAccount = createAction({
  auth: brexAuth,
  name: 'get_primary_cash_account',
  displayName: 'Get Primary Cash Account',
  description: 'Get the primary Brex Cash account with its balance and status.',
  props: {},
  async run(context) {
    const response = await brexCommon.apiCall<BrexCashAccount>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/accounts/cash/primary',
    });
    return brexCommon.flattenCashAccount(response.body);
  },
});
