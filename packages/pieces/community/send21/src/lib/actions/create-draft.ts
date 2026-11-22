import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { send21Auth } from '../auth';
import { authKey, send21Request } from '../common/client';
import { PAYMENT_CURRENCIES, PAYMENT_METHODS, PAYMENT_NETWORKS } from '../common/constants';

export const createDraft = createAction({
  auth: send21Auth,
  name: 'create_draft',
  classification: 'WRITE',
  displayName: 'Create Draft',
  description:
    'Prepare a payment (POST /drafts). No funds move until a person signs and sends from their own wallet.',
  audience: 'both',
  aiMetadata: {
    description:
      'Prepare one send21 payment draft for a fixed receiver, asset and network; nothing moves until a person signs and sends from their own wallet. Use Create Payment Request instead for a fiat-priced link where the payer picks the coin. Each call creates a new draft.',
    idempotent: false,
  },
  props: {
    receiverAddress: Property.ShortText({
      displayName: 'Receiver Address',
      description:
        'Address that will receive the payment. On default ApprovedOnly accounts the owner must have approved it first.',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: true,
      options: { options: PAYMENT_CURRENCIES },
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      required: true,
      options: { options: PAYMENT_NETWORKS },
    }),
    paymentMethod: Property.StaticDropdown({
      displayName: 'Payment Method',
      required: true,
      defaultValue: 'MultiOutput',
      options: { options: PAYMENT_METHODS },
    }),
    amountType: Property.StaticDropdown({
      displayName: 'Amount Type',
      required: true,
      defaultValue: 'fiat',
      options: {
        options: [
          { label: 'Fiat Amount', value: 'fiat' },
          { label: 'Base Units', value: 'base' },
        ],
      },
    }),
    fiatCurrency: Property.ShortText({
      displayName: 'Fiat Currency',
      required: false,
      defaultValue: 'EUR',
    }),
    fiatAmount: Property.Number({
      displayName: 'Fiat Amount',
      required: false,
    }),
    amountSats: Property.Number({
      displayName: 'Amount (Base Units)',
      description:
        'Sent as amountSats. 8 decimals for BTC (sats), 6 for USDC, USDT and EURC, 9 for SOL and ETH (ETH in gwei).',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency Key',
      required: true,
    }),
    memo: Property.ShortText({ displayName: 'Memo', required: false }),
    expiryHours: Property.Number({
      displayName: 'Expiry Hours',
      description: 'From 1 to 720 hours. Default 24. The expiry never moves once the draft is created.',
      required: false,
      defaultValue: 24,
    }),
    singleOutput: Property.Checkbox({
      displayName: 'Single Output',
      description:
        'Whether to create one QR payment from any wallet, with the send21 fee billed to the account. When turned off, the fee is a separate output and the draft suits PSBT and batching wallets.',
      required: false,
      defaultValue: true,
    }),
    absorbUpToPercent: Property.Number({
      displayName: 'Shortfall Absorb Up To Percent',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      receiverAddress: context.propsValue.receiverAddress,
      currency: context.propsValue.currency,
      network: context.propsValue.network,
      paymentMethod: context.propsValue.paymentMethod,
    };
    if (context.propsValue.amountType === 'base') {
      body.amountSats = context.propsValue.amountSats;
    } else {
      body.fiatCurrency = context.propsValue.fiatCurrency;
      body.fiatAmount = context.propsValue.fiatAmount;
    }
    if (context.propsValue.memo) body.memo = context.propsValue.memo;
    if (context.propsValue.expiryHours !== undefined) body.expiryHours = context.propsValue.expiryHours;
    if (context.propsValue.singleOutput !== undefined) body.singleOutput = context.propsValue.singleOutput;
    const absorb = Number(context.propsValue.absorbUpToPercent ?? 0);
    if (absorb > 0) body.shortfallPolicy = { absorbUpToPercent: absorb, absorbedBy: 'receiver' };

    return send21Request({
      apiKey: authKey(context.auth),
      method: HttpMethod.POST,
      path: '/drafts',
      body,
      idempotencyKey: context.propsValue.idempotencyKey,
    });
  },
});
