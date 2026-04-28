import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getPlayerProfile = createAction({
  name: 'get_player_profile',
  displayName: 'Get Player Profile',
  description: 'Retrieve a Chess.com player profile by username.',
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
      url: `https://api.chess.com/pub/player/${propsValue.username}`,
    });
    return response.body;
  },
});