import { createAction, Property } from '@activepieces/pieces-framework';
import {
  assertPlatformCurrency,
  currencyProperty,
  getCashClient,
  parseUsdc,
  platformProperty,
  resolveCurrency,
  toSerializable,
} from '../common';

export const estimateCashOut = createAction({
  name: 'estimate_cash_out',
  displayName: 'Estimate Cash Out',
  description:
    'Estimate fiat proceeds at the current oracle rate without creating an order.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns a read-only Peer Cash oracle estimate for a Base USDC amount and fiat currency, with optional recent fill timing for a payout platform. The rate is indicative and binds only when a buyer fills the order. Idempotent for the same live market state.',
    idempotent: true,
  },
  props: {
    amount: Property.ShortText({
      displayName: 'USDC Amount',
      description: 'Base USDC amount in human units, for example 25.50.',
      required: true,
    }),
    currency: currencyProperty(),
    platform: platformProperty(false),
    includeEta: Property.Checkbox({
      displayName: 'Include Recent Fill Estimate',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const currency = resolveCurrency(context.propsValue.currency);
    const platform = context.propsValue.platform;
    if (platform) {
      assertPlatformCurrency(platform, currency);
    }
    const result = await getCashClient().estimate(
      {
        amount: parseUsdc(context.propsValue.amount, 'USDC amount'),
        currency,
        platform,
      },
      { includeEta: context.propsValue.includeEta }
    );
    return toSerializable(result);
  },
});
