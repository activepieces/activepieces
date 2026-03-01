import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreatePayment = createAction({
  auth: xeroAuth,
  name: 'xero_create_payment',
  displayName: 'Create Payment',
  description: 'Applies a payment to an invoice.',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: props.payable_invoice_id(true),
    account_id: props.bank_account_id(true),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Payment amount (must be <= amount due).',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Payment Date',
      description: 'YYYY-MM-DD.',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      required: false,
    }),
    is_reconciled: Property.Checkbox({
      displayName: 'Is Reconciled',
      description: 'Mark payment as reconciled (optional).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { tenant_id, invoice_id, account_id, amount, date, reference, is_reconciled } =
      context.propsValue;

    const url = 'https://api.xero.com/api.xro/2.0/Payments';

    const payload: Record<string, unknown> = {
      Payments: [
        {
          Invoice: { InvoiceID: invoice_id },
          Account: { AccountID: account_id },
          Date: date,
          Amount: amount,
          ...(reference ? { Reference: reference } : {}),
          ...(is_reconciled ? { IsReconciled: true } : {}),
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


