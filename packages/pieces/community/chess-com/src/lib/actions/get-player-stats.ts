import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getPlayerStats = createAction({
  name: 'get_player_stats',
  displayName: 'Get Player Stats',
  description: 'Retrieve ratings and statistics for a Chess.com player.',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The Chess.com username to look up.',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.chess.com/pub/player/${propsValue.username}/stats`,
    });
    return response.body;
  },
});
