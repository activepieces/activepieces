import { createAction, Property } from '@activepieces/pieces-framework';
import { giphyAuth } from '../auth';
import { giphyApiClient } from '../common';

export const randomStickerAction = createAction({
  auth: giphyAuth,
  name: 'random_sticker',
  displayName: 'Random Sticker',
  description: 'Returns a random GIF, limited by tag. Excluding the tag parameter will return a random GIF from the GIPHY catalog. ',
  props: {
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Filters results by specified tag.',
      required: false,
    }),
    rating: Property.ShortText({
      displayName: 'Rating',
      description: 'Filters results by specified rating.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await giphyApiClient.get({
      auth, endpoint: '/stickers/random',
      queryParams: {
        tag: propsValue.tag,
        rating: propsValue.rating,
      },
    });
    return response.body;
  },
});
