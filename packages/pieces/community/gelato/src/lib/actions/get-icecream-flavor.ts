import {
  createAction,
  Property,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gelatoAuth } from '../..';

export const getIcecreamFlavor = createAction({
  name: 'get_icecream_flavor', // Must be a unique across the piece, this shouldn't be changed.
  auth: gelatoAuth,
  displayName: 'Get Icecream Flavor',
  description: 'Fetches random icecream flavor',
  props: {},
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: 'https://cloud.activepieces.com/api/v1/webhooks/RGjv57ex3RAHOgs0YK6Ja/sync',
      headers: {
        Authorization: context.auth, // Pass API key in headers
      },
    });
    return res.body;
  },
});
