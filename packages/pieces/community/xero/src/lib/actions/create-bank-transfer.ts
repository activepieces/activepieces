import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateBankTransfer = createAction({
  auth: xeroAuth,
  name: 'xero_create_bank_transfer',
  displayName: 'Create Bank Transfer',
  description: 'Transfers money between two bank accounts in Xero.',
  props: {
    tenant_id: props.tenant_id,
    from_bank_account_id: props.bank_account_id(true),
    to_bank_account_id: props.bank_account_id(true),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount to transfer. Currencies must match between accounts.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Transfer Date',
      description: 'YYYY-MM-DD. Defaults to today if not provided.',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Reference for the transfer.',
      required: false,
    }),
    from_is_reconciled: Property.Checkbox({
      displayName: 'From Is Reconciled',
      description: 'Mark source account transaction as reconciled.',
      required: false,
      defaultValue: false,
    }),
    to_is_reconciled: Property.Checkbox({
      displayName: 'To Is Reconciled',
      description: 'Mark destination account transaction as reconciled.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      tenant_id,
      from_bank_account_id,
      to_bank_account_id,
      amount,
      date,
      reference,
      from_is_reconciled,
      to_is_reconciled,
    } = context.propsValue;

    const url = 'https://api.xero.com/api.xro/2.0/BankTransfers';

    const payload: Record<string, unknown> = {
      BankTransfers: [
        {
          FromBankAccount: { AccountID: from_bank_account_id },
          ToBankAccount: { AccountID: to_bank_account_id },
          Amount: amount,
          ...(date ? { Date: date } : {}),
          ...(reference ? { Reference: reference } : {}),
          ...(from_is_reconciled ? { FromIsReconciled: true } : {}),
          ...(to_is_reconciled ? { ToIsReconciled: true } : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
      },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


