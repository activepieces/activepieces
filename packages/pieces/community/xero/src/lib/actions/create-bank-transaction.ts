import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateBankTransaction = createAction({
  auth: xeroAuth,
  name: 'xero_create_bank_transaction',
  displayName: 'Create Bank Transaction',
  description: 'Creates a new Spend/Receive Money bank transaction.',
  audience: 'both',
  aiMetadata: {
    description:
      'Record a Spend Money (SPEND) or Receive Money (RECEIVE) bank transaction against one of the organization\'s bank accounts, attributed to a contact with at least one line item (Description, UnitAmount, AccountCode). Pick this for direct money in/out of a bank account, not for paying an invoice (use Create Payment) or moving money between own accounts (use Create Bank Transfer). Not idempotent: each call records another transaction.',
    idempotent: false,
  },
  props: {
    tenant_id: props.tenant_id,
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'Spend Money (SPEND)', value: 'SPEND' },
          { label: 'Receive Money (RECEIVE)', value: 'RECEIVE' },
        ],
      },
      defaultValue: 'SPEND',
    }),
    contact_id: props.contact_dropdown(true),
    bank_account_id: props.bank_account_id(true),
    line_item: Property.Object({
      displayName: 'Line Item',
      description: 'At minimum, provide a Description, UnitAmount, and AccountCode.',
      required: true,
      defaultValue: {
        Description: 'Goods/Services',
        UnitAmount: 0,
        AccountCode: '',
      },
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Date the transaction occurred (YYYY-MM-DD). Optional.',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Reference for the transaction.',
      required: false,
    }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: false,
      options: {
        options: [
          { label: 'Exclusive', value: 'Exclusive' },
          { label: 'Inclusive', value: 'Inclusive' },
          { label: 'NoTax', value: 'NoTax' },
        ],
      },
    }),
    is_reconciled: Property.Checkbox({
      displayName: 'Is Reconciled',
      description: 'Mark the transaction as reconciled.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      tenant_id,
      type,
      contact_id,
      bank_account_id,
      line_item,
      date,
      reference,
      line_amount_types,
      is_reconciled,
    } = context.propsValue;

    const url = 'https://api.xero.com/api.xro/2.0/BankTransactions';

    const payload = {
      BankTransactions: [
        {
          Type: type,
          Contact: { ContactID: contact_id },
          BankAccount: { AccountID: bank_account_id },
          LineItems: [line_item],
          ...(date ? { Date: date } : {}),
          ...(reference ? { Reference: reference } : {}),
          ...(line_amount_types ? { LineAmountTypes: line_amount_types } : {}),
          ...(is_reconciled ? { IsReconciled: true } : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
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
