import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getDailyPuzzle = createAction({
  name: 'get_daily_puzzle',
  displayName: 'Get Daily Puzzle',
  description: "Retrieve today's Chess.com daily puzzle.",
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.chess.com/pub/puzzle',
    });
    return response.body;
  },
});
