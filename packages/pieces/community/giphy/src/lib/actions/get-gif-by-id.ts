import { createAction, Property } from '@activepieces/pieces-framework';
import { giphyAuth } from '../auth';
import { giphyApiClient } from '../common';

export const getGifByIdAction = createAction({
  auth: giphyAuth,
  name: 'get_gif_by_id',
  displayName: 'Get GIF by Id',
  description: 'Returns a GIF given that GIF\'s unique ID ',
  props: {
    gifId: Property.Number({
      displayName: 'Gif Id',
      description: 'Filters results by specified GIF ID.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await giphyApiClient.get({
      auth, endpoint: `/gifs/${propsValue.gifId}`,
    });
    return response.body;
  },
});
