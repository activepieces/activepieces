import { createAction, Property } from '@activepieces/pieces-framework';
import { coinstatsAuth } from '../../index';
import { makeClient } from '../coinstats-api';

export const getMarkets = createAction({
  name: 'get_markets',
  displayName: 'Get Markets',
  description: 'List cryptocurrency exchanges and markets with trading volume and pairs.',
  auth: coinstatsAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of markets to return',
      required: false,
      defaultValue: 20,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of markets to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth);
    return await client.getMarkets({
      limit: context.propsValue.limit ?? 20,
      skip: context.propsValue.skip ?? 0,
    });
  },
});
