import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { apiverveAuth } from '../auth';
import { apiverveCommon } from '../common';

export const getExchangeRateAction = createAction({
  auth: apiverveAuth,
  name: 'get_exchange_rate',
  classification: 'READ',
  displayName: 'Get Exchange Rate',
  description:
    'Get the exchange rate between two currencies, today or on a past date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Return the conversion rate from one currency to another using ISO codes, for today or a past date. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    currency1: Property.ShortText({
      displayName: 'From Currency',
      description: 'Three-letter currency code, for example USD.',
      required: true,
    }),
    currency2: Property.ShortText({
      displayName: 'To Currency',
      description: 'Three-letter currency code, for example EUR.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description:
        'Optional past date in YYYY-MM-DD format. Leave empty for the latest rate.',
      required: false,
    }),
  },
  async run(context) {
    return apiverveCommon.callApiverve({
      apiKey: context.auth.secret_text,
      path: '/v1/exchangerate',
      method: HttpMethod.GET,
      query: apiverveCommon.toQuery({
        currency1: context.propsValue.currency1,
        currency2: context.propsValue.currency2,
        date: context.propsValue.date,
      }),
    });
  },
});
