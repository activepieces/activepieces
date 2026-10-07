import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareMoney } from '../common/money';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

const EXTERNAL_TYPES = ['CHECK', 'BANK_TRANSFER', 'OTHER_GIFT_CARD', 'CRYPTO', 'SQUARE_CASH', 'SOCIAL', 'EXTERNAL', 'EMONEY', 'CARD', 'STORED_BALANCE', 'FOOD_VOUCHER', 'OTHER'];

export const recordExternalPaymentAction = createAction({
  name: 'record_external_payment',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Record Cash or External Payment',
  description:
    'Records money you received outside Square (cash, check, bank transfer, another app). Never charges a card. Needs a connection created or reconnected with piece version 1.0.0 or later.',
  audience: 'both',
  aiMetadata: {
    description:
      'Records a completed CASH or EXTERNAL payment in Square for money already received elsewhere; it never charges a card. Amount is a decimal string like "12.50" in the location currency; with an Order ID it must equal the order total due. Needs PAYMENTS_WRITE (reconnect older connections). A retried step in the same run is not recorded twice; a new run records another payment.',
    idempotent: false,
  },
  props: {
    source: Property.StaticDropdown({
      displayName: 'Payment Type',
      required: true,
      defaultValue: 'CASH',
      options: {
        options: [
          { label: 'Cash', value: 'CASH' },
          { label: 'Other (outside Square)', value: 'EXTERNAL' },
        ],
      },
    }),
    amount: Property.ShortText({ displayName: 'Amount', description: 'For example 12.50.', required: true }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'Leave empty to use the location currency.', required: false }),
    external_type: Property.StaticDropdown({
      displayName: 'External Type',
      description: 'For Other payments: how the money was received.',
      required: false,
      options: {
        options: EXTERNAL_TYPES.map((value) => ({ label: value.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()), value })),
      },
    }),
    external_source: Property.ShortText({ displayName: 'External Source', description: 'For Other payments: the provider, for example "Venmo" or "Bank of X".', required: false }),
    location_id: Property.ShortText({ displayName: 'Location ID', description: 'Leave empty to use the main location.', required: false }),
    order_id: Property.ShortText({ displayName: 'Order ID', description: 'Optional order this payment pays for.', required: false }),
    customer_id: Property.ShortText({ displayName: 'Customer ID', required: false }),
    reference_id: Property.ShortText({ displayName: 'Reference ID', required: false }),
    note: Property.ShortText({ displayName: 'Note', required: false }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.payment,
  async run(context) {
    const p = context.propsValue;
    const source = p.source === 'EXTERNAL' ? 'EXTERNAL' : 'CASH';
    const location = await squareClient.resolveLocation({ auth: context.auth, locationId: squareInputs.optionalId({ value: p.location_id, label: 'Location ID' }) });
    const currency = squareMoney.normalizeCurrency(p.currency) ?? squareShape.str({ value: location, key: 'currency' });
    if (!currency) {
      throw new Error('Could not find the currency of the location. Fill Currency.');
    }
    const amountMoney = { amount: squareMoney.toMinor({ amount: p.amount, currency, label: 'Amount' }), currency };
    const externalType = squareInputs.text(p.external_type);
    const externalSource = squareInputs.text(p.external_source);
    if (source === 'EXTERNAL') {
      if (!externalType || !EXTERNAL_TYPES.includes(externalType)) {
        throw new Error(`External Type is required for Other payments: one of ${EXTERNAL_TYPES.join(', ')}.`);
      }
      if (!externalSource) {
        throw new Error('External Source is required for Other payments, for example "Venmo".');
      }
    }
    const payload = squareOps.dropUndefined({
      source_id: source,
      amount_money: amountMoney,
      location_id: String(location['id']),
      order_id: squareInputs.optionalId({ value: p.order_id, label: 'Order ID' }),
      customer_id: squareInputs.optionalId({ value: p.customer_id, label: 'Customer ID' }),
      reference_id: squareInputs.text(p.reference_id),
      note: squareInputs.text(p.note),
      cash_details: source === 'CASH' ? { buyer_supplied_money: amountMoney } : undefined,
      external_details: source === 'EXTERNAL' ? { type: externalType, source: externalSource } : undefined,
      autocomplete: true,
    });
    const idempotencyKey = squareIdempotency.fromContext({ context, action: 'record_external_payment', input: payload });
    const body = await squareClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: ['v2', 'payments'],
      body: { ...payload, idempotency_key: idempotencyKey },
      operation: 'record the payment',
    });
    return squareShape.payment(squareShape.requireObject({ body, key: 'payment', what: 'payment' }));
  },
});
