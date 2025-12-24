import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../common/auth';
import { accountIdProp } from '../../common/props';
import { ENDPOINTS } from '../../common/constants';

export const updateAccount = createAction({
  name: 'account_update',
  displayName: 'Account - Update',
  description: 'Update account information in Fiserv',
  auth: fiservAuth,
  props: {
    accountId: accountIdProp,

    accountStatus: Property.StaticDropdown({
      displayName: 'Account Status',
      description: 'Update account status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
          { label: 'Closed', value: 'Closed' },
          { label: 'Dormant', value: 'Dormant' },
        ],
      },
    }),

    interestRate: Property.Number({
      displayName: 'Interest Rate',
      description: 'Updated interest rate percentage',
      required: false,
    }),

    creditLimit: Property.Number({
      displayName: 'Credit Limit',
      description: 'Updated credit limit (for credit accounts)',
      required: false,
    }),

    nickname: Property.ShortText({
      displayName: 'Account Nickname',
      description: 'Friendly name for the account',
      required: false,
    }),
  },

  async run(context) {
    const {
      accountId, accountStatus, interestRate,
      creditLimit, nickname
    } = context.propsValue;

    const auth = context.auth as any;

    const requestBody: any = {
      AcctKeys: {
        AcctId: accountId,
      },
    };

    // Build update fields
    const updateFields: any = {};

    if (accountStatus) {
      updateFields.AcctStatus = accountStatus;
    }
    if (interestRate !== undefined && interestRate !== null) {
      updateFields.Rate = interestRate;
    }
    if (creditLimit !== undefined && creditLimit !== null) {
      updateFields.CreditLimit = creditLimit;
    }
    if (nickname) {
      updateFields.Nickname = nickname;
    }

    if (Object.keys(updateFields).length > 0) {
      requestBody.AcctInfo = updateFields;
    }

    const response = await callFiservApi(
      HttpMethod.PUT,
      auth,
      ENDPOINTS.ACCOUNTS_UPDATE,
      requestBody
    );

    return response.body;
  },
});
