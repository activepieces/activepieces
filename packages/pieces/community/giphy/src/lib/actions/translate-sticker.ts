import { createAction, Property } from '@activepieces/pieces-framework';
import { giphyAuth } from '../auth';
import { giphyApiClient } from '../common';

export const translateStickerAction = createAction({
  auth: giphyAuth,
  name: 'translate_sticker',
  displayName: 'Translate phrase to Sticker',
  description: 'The translate API draws on search, but uses the GIPHY `special sauce` to handle translating from one vocabulary to another. In this case, words and phrases to GIFs. ',
  props: {
    s: Property.ShortText({
      displayName: 'S',
      description: 'Search term.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await giphyApiClient.get({
      auth, endpoint: '/stickers/translate',
      queryParams: {
        s: propsValue.s,
      },
    });
    return response.body;
  },
});
