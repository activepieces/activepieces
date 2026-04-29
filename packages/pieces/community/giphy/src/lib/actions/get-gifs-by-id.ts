import { createAction, Property } from '@activepieces/pieces-framework';
import { giphyAuth } from '../auth';
import { giphyApiClient } from '../common';

export const getGifsByIdAction = createAction({
  auth: giphyAuth,
  name: 'get_gifs_by_id',
  displayName: 'Get GIFs by ID',
  description: 'A multiget version of the get GIF by ID endpoint. ',
  props: {
    ids: Property.ShortText({
      displayName: 'Ids',
      description: 'Filters results by specified GIF IDs, separated by commas.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await giphyApiClient.get({
      auth, endpoint: '/gifs',
      queryParams: {
        ids: propsValue.ids,
      },
    });
    return response.body;
  },
});
