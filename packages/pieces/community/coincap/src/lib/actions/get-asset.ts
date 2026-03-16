import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../coincap-api';

export const getAsset = createAction({
  name: 'get_asset',
  displayName: 'Get Asset',
  description: 'Get detailed data for a single cryptocurrency by its ID.',
  props: {
    id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset ID (e.g. "bitcoin", "ethereum", "solana").',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;
    return makeRequest(HttpMethod.GET, `/assets/${encodeURIComponent(id)}`);
  },
});
