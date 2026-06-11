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
  audience: 'both',
  aiMetadata: {
    description:
      "Looks up a Chess.com player's competitive statistics by username, returning per-time-control ratings and win/draw/loss records (rapid, blitz, bullet, chess960, and others). Use when you need a player's strength or results; for profile/identity details use Get Player Profile instead. Requires an exact username (3-25 chars, alphanumeric/underscore/hyphen), matched case-insensitively. Read-only and idempotent.",
    idempotent: true,
  },
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
