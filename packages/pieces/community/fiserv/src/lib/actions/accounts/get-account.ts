import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../common/auth';
import { accountIdProp } from '../../common/props';
import { ENDPOINTS } from '../../common/constants';

export const getAccount = createAction({
  name: 'account_get',
  displayName: 'Account - Get',
  description: 'Retrieve account information from Fiserv',
  auth: fiservAuth,
  props: {
    accountId: accountIdProp,
    includeBalance: Property.Checkbox({
      displayName: 'Include Balance',
      description: 'Include current balance information',
      required: false,
      defaultValue: true,
    }),
    includeTransactions: Property.Checkbox({
      displayName: 'Include Recent Transactions',
      description: 'Include recent transaction history',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { accountId, includeBalance, includeTransactions } = context.propsValue;
    const auth = context.auth as any;

    const requestBody = {
      AcctKeys: {
        AcctId: accountId,
      },
      IncludeBalance: includeBalance,
      IncludeTransactions: includeTransactions,
    };

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      ENDPOINTS.ACCOUNTS_GET,
      requestBody
    );

    return response.body;
  },
});
