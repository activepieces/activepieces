import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { z } from 'zod';

export const getPlayerProfile = createAction({
  name: 'get_player_profile',
  displayName: 'Get Player Profile',
  description:
    "Retrieve a Chess.com player's public profile by username (avatar, country, join date, followers).",
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
      )}`,
    });
    return response.body;
  },
});
