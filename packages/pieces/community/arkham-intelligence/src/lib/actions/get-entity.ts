import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { arkhamAuth } from '../../index';
import { arkhamApiCall } from '../arkham-api';

export const getEntityAction = createAction({
  auth: arkhamAuth,
  name: 'get-entity',
  displayName: 'Get Entity Profile',
  description: 'Retrieve the full profile of a known on-chain entity — exchanges, funds, protocols, and more — including name, type, labels, and associated addresses.',
  props: {
    entityId: Property.ShortText({
      displayName: 'Entity ID',
      description: 'The Arkham entity ID (e.g. "binance", "a16z", "coinbase"). Found in address intelligence responses.',
      required: true,
    }),
  },
  async run(context) {
    const { entityId } = context.propsValue;
    const data = await arkhamApiCall({
      apiKey: context.auth,
      endpoint: `/intelligence/entity/${encodeURIComponent(entityId)}`,
      method: HttpMethod.GET,
    });
    return data;
  },
});
