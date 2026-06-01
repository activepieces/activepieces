import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { apId } from '@activepieces/shared';
import { brexAuth } from '../../';
import { brexCommon, BrexTransfer } from '../common';

export const createTransfer = createAction({
  auth: brexAuth,
  name: 'create_transfer',
  displayName: 'Create Transfer',
  description: 'Send a payment from a Brex Cash account to a vendor.',
  props: {
    vendorPaymentInstrumentId: brexCommon.vendorPaymentInstrumentDropdown,
    originatingAccountId: brexCommon.cashAccountDropdown,
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount to send, in the major currency unit (e.g. 100.50 for $100.50).',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The 3-letter ISO currency code (e.g. USD).',
      required: false,
      defaultValue: 'USD',
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'An internal description for this transfer (not shown to the vendor).',
      required: true,
    }),
    external_memo: Property.ShortText({
      displayName: 'Memo to Vendor',
      description:
        'A memo shown to the vendor on the payment. Max 90 characters for ACH/wire, 40 for cheques.',
      required: true,
    }),
  },
  async run(context) {
    const {
      vendorPaymentInstrumentId,
      originatingAccountId,
      amount,
      currency,
      description,
      external_memo,
    } = context.propsValue;

    const response = await brexCommon.apiCall<BrexTransfer>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/transfers',
      idempotencyKey: apId(),
      body: {
        amount: {
          amount: Math.round(amount * 100),
          currency: currency ?? 'USD',
        },
        counterparty: {
          type: 'VENDOR',
          payment_instrument_id: vendorPaymentInstrumentId,
        },
        originating_account: {
          type: 'BREX_CASH',
          id: originatingAccountId,
        },
        description,
        external_memo,
      },
    });
    return brexCommon.flattenTransfer(response.body);
  },
});
