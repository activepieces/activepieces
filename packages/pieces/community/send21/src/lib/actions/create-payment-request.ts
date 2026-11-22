import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { send21Auth } from '../auth';
import { authKey, payLinkFrom, send21Request } from '../common/client';
import { PAYMENT_CURRENCIES, PAYMENT_METHODS, PAYMENT_NETWORKS } from '../common/constants';

export const createPaymentRequest = createAction({
  auth: send21Auth,
  name: 'create_payment_request',
  classification: 'WRITE',
  displayName: 'Create Payment Request',
  description:
    'Create a fiat-priced pay link (POST /payment-requests). The payer opens the link and signs and sends from their own wallet.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a fiat-priced send21 pay link for one payment; the payer opens it and signs and sends from their own wallet. Use Create Draft instead when you already know the exact asset, network and amount. Retries with the same Idempotency Key return the original pay link, and Reuse Open For Order returns the open link for the same Order ID.',
    idempotent: true,
  },
  props: {
    fiatCurrency: Property.ShortText({
      displayName: 'Fiat Currency',
      description: 'ISO currency code to price the pay link in, for example EUR, USD or SEK.',
      required: true,
      defaultValue: 'EUR',
    }),
    fiatAmount: Property.Number({
      displayName: 'Fiat Amount',
      description: 'Amount in the fiat currency. The rate locks when the payer picks an asset.',
      required: true,
    }),
    options: Property.Array({
      displayName: 'Receiving Options',
      description:
        'Currencies you accept, each with your own receiving address. New accounts only accept addresses the owner approved in send21. Use method Lightning for BTC paid to a Lightning address.',
      required: true,
      properties: {
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
        address: Property.ShortText({
          displayName: 'Address',
          required: true,
        }),
        method: Property.StaticDropdown({
          displayName: 'Method',
          required: false,
          defaultValue: 'MultiOutput',
          options: { options: PAYMENT_METHODS },
        }),
      },
    }),
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'Your own order or invoice id, returned on the signed webhook.',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency Key',
      description:
        'Send the same key to retry the exact same create call and get the original object back. A reused key with a different amount, currency or address is refused with 422.',
      required: true,
    }),
    memo: Property.ShortText({ displayName: 'Memo', required: false }),
    declineNote: Property.ShortText({
      displayName: 'Decline Note',
      description: 'Shown on the pay page under the amount as "If you don\'t pay:". Plain text, up to 200 characters.',
      required: false,
    }),
    expiryHours: Property.Number({
      displayName: 'Expiry Hours',
      description: 'How long the pay link stays open, from 1 to 720 hours. Default 24. The expiry never moves once created.',
      required: false,
      defaultValue: 24,
    }),
    reuseOpenForOrder: Property.Checkbox({
      displayName: 'Reuse Open For Order',
      description:
        'Whether to return the open pay link for the same order ID instead of creating a second one.',
      required: false,
      defaultValue: true,
    }),
    absorbUpToPercent: Property.Number({
      displayName: 'Shortfall Absorb Up To Percent',
      description:
        'Automatically accept payments that arrive up to this percent short. Overpayments always wait for a person. Leave empty to turn this off.',
      required: false,
    }),
  },
  async run(context) {
    const options = (context.propsValue.options ?? []) as Array<{
      currency: string;
      network: string;
      address: string;
      method?: string;
    }>;
    if (!options.length) {
      throw new Error('Add at least one receiving option (currency, network and your own address).');
    }
    const body: Record<string, unknown> = {
      fiatCurrency: context.propsValue.fiatCurrency,
      fiatAmount: context.propsValue.fiatAmount,
      options: options.map((o) => ({
        currency: o.currency,
        network: o.network,
        address: o.address,
        ...(o.method ? { method: o.method } : {}),
      })),
    };
    if (context.propsValue.orderId) body.orderId = context.propsValue.orderId;
    if (context.propsValue.memo) body.memo = context.propsValue.memo;
    if (context.propsValue.declineNote) body.declineNote = context.propsValue.declineNote;
    if (context.propsValue.expiryHours !== undefined) body.expiryHours = context.propsValue.expiryHours;
    if (context.propsValue.reuseOpenForOrder !== undefined) {
      body.reuseOpenForOrder = context.propsValue.reuseOpenForOrder;
    }
    const absorb = Number(context.propsValue.absorbUpToPercent ?? 0);
    if (absorb > 0) body.shortfallPolicy = { absorbUpToPercent: absorb, absorbedBy: 'receiver' };

    const created = await send21Request<Record<string, unknown>>({
      apiKey: authKey(context.auth),
      method: HttpMethod.POST,
      path: '/payment-requests',
      body,
      idempotencyKey: context.propsValue.idempotencyKey,
    });
    return payLinkFrom(created);
  },
});
