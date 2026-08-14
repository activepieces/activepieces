import { createAction, Property } from '@activepieces/pieces-framework';
import {
  assertPlatformCurrency,
  currencyProperty,
  getCashClient,
  parseOptionalUsdc,
  parseUsdc,
  platformProperty,
  referralCodeProperty,
  resolveCurrency,
  toSerializable,
} from '../common';

export const prepareCashOut = createAction({
  name: 'prepare_cash_out',
  displayName: 'Prepare Cash Out',
  description:
    'Prepare unsigned Base transactions for a market-rate fiat cash-out.',
  audience: 'both',
  aiMetadata: {
    description:
      'Registers payout details and prepares unsigned approve and create-deposit transactions for a Base USDC cash-out. The host must inspect, sign, and submit transactions in order. Some payout methods require prior payee verification or a follow-up access-policy transaction. Not idempotent because it can register payee details.',
    idempotent: false,
  },
  props: {
    amount: Property.ShortText({
      displayName: 'USDC Amount',
      description: 'Base USDC amount in human units, for example 25.50.',
      required: true,
    }),
    platform: platformProperty(true),
    currency: currencyProperty(),
    payee: Property.ShortText({
      displayName: 'Payee Handle',
      description:
        'Recipient handle or account identifier for the selected payment platform.',
      required: true,
    }),
    minimumFillAmount: Property.ShortText({
      displayName: 'Minimum Fill Amount',
      description:
        'Optional minimum partial fill in USDC. Set this together with the maximum.',
      required: false,
    }),
    maximumFillAmount: Property.ShortText({
      displayName: 'Maximum Fill Amount',
      description:
        'Optional maximum partial fill in USDC. Set this together with the minimum.',
      required: false,
    }),
    referralCode: referralCodeProperty(),
  },
  async run(context) {
    const currency = resolveCurrency(context.propsValue.currency);
    const platform = context.propsValue.platform;
    if (!platform) {
      throw new Error('Select a payment platform');
    }
    assertPlatformCurrency(platform, currency);
    const minimumFillAmount = parseOptionalUsdc(
      context.propsValue.minimumFillAmount,
      'Minimum fill amount'
    );
    const maximumFillAmount = parseOptionalUsdc(
      context.propsValue.maximumFillAmount,
      'Maximum fill amount'
    );
    if (
      (minimumFillAmount === undefined) !==
      (maximumFillAmount === undefined)
    ) {
      throw new Error('Set both minimum and maximum fill amounts, or neither');
    }
    const intentAmountRange =
      minimumFillAmount !== undefined && maximumFillAmount !== undefined
        ? { min: minimumFillAmount, max: maximumFillAmount }
        : undefined;
    const result = await getCashClient(context.propsValue.referralCode).prepare(
      {
        amount: parseUsdc(context.propsValue.amount, 'USDC amount'),
        receive: {
          platform,
          currency,
          payee: context.propsValue.payee,
        },
        intentAmountRange,
      }
    );
    return toSerializable(result);
  },
});
