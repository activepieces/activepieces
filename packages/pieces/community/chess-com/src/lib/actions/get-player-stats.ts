import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { z } from 'zod';

export const getPlayerStats = createAction({
  name: 'get_player_stats',
  displayName: 'Get Player Stats',
  description:
    'Retrieve a Chess.com player\'s ratings and W/D/L for rapid, blitz, bullet, and chess960.',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The Chess.com username to look up.',
      required: true,
    }),
  },
  async run({ propsValue }) {
    await propsValidation.validateZod(propsValue, {
      username: z
        .string()
        .trim()
        .min(3)
        .max(25)
        .regex(/^[A-Za-z0-9_-]+$/),
    });
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.chess.com/pub/player/${encodeURIComponent(
        propsValue.username.trim().toLowerCase(),
      )}/stats`,
    });
    return response.body;
  },
});
