import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../coincap-api';

export const getExchanges = createAction({
  name: 'get_exchanges',
  displayName: 'Get Exchanges',
  description: 'List all cryptocurrency exchanges with volume, trading pairs, and rank.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results to return (default 20, max 2000).',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip for pagination.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, offset } = context.propsValue;
    return makeRequest(HttpMethod.GET, '/exchanges', { limit, offset });
  },
});
