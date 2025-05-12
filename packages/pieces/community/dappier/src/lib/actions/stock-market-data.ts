import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dappierAuth } from '../..';
import { dappierCommon } from '../common';

export const stockMarketDataSearch = createAction({
  name: 'stock_market_data_search',
  auth: dappierAuth,
  displayName: 'Stock Market Data',
  description:
    'Access real-time financial news, stock prices, and trades from polygon.io, with AI-powered insights and up-to-the-minute updates to keep you informed on all your financial interests.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter your stock market query',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${dappierCommon.baseUrl}/app/aimodel/am_01j749h8pbf7ns8r1bq9s2evrh`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        query: propsValue.query,
      },
    });

    return res.body;
  },
});
