import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getDailyPuzzle = createAction({
  name: 'get_daily_puzzle',
  displayName: 'Get Daily Puzzle',
  description: "Retrieve today's Chess.com daily puzzle.",
  audience: 'both',
  aiMetadata: {
    description:
      "Fetches the current Chess.com daily puzzle (title, board position/FEN, PGN, and puzzle image). Takes no input and always returns the puzzle for the current day. Read-only and idempotent within a given day.",
    idempotent: true,
  },
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.chess.com/pub/puzzle',
    });
    return response.body;
  },
});
