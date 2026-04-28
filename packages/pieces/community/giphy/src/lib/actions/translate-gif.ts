import { createAction, Property } from '@activepieces/pieces-framework';
import { giphyAuth } from '../auth';
import { giphyApiClient } from '../common';

export const translateGifAction = createAction({
  auth: giphyAuth,
  name: 'translate_gif',
  displayName: 'Translate phrase to GIF',
  description: 'The translate API draws on search, but uses the GIPHY `special sauce` to handle translating from one vocabulary to another. In this case, words and phrases to GIF ',
  props: {
    s: Property.ShortText({
      displayName: 'S',
      description: 'Search term.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await giphyApiClient.get({
      auth, endpoint: '/gifs/translate',
      queryParams: {
        s: propsValue.s,
      },
    });
    return response.body;
  },
});
