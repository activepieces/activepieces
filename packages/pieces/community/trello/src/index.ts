import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCard } from './lib/actions/create-card';
import { getCard } from './lib/actions/get-card';
import { cardMovedTrigger } from './lib/triggers/cardMoved';
import { newCardTrigger } from './lib/triggers/newCard';

const markdownProperty = `
To obtain your API key and token, follow these steps:

1. Go to https://trello.com/power-ups/admin
2. Click **New** to create a new power-up
3. Enter power-up information, and click **Create**
4. From the API Key page, click **Generate a new API key**
5. Copy **API Key** and enter it into the Trello API Key connection
6. Click **manually generate a Token** next to the API key field
7. Copy the token and paste it into the Trello Token connection
8. Your connection should now work!
`;
export const trelloAuth = PieceAuth.BasicAuth({
  description: markdownProperty,
  required: true,
  username: {
    displayName: 'API Key',
    description: 'Trello API Key',
  },
  password: {
    displayName: 'Token',
    description: 'Trello Token',
  },
  validate: async ({ auth }) => {
    const { username, password } = auth;
    if (!username || !password) {
      return {
        valid: false,
        error: 'Empty API Key or Token',
      };
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url:
          `https://api.trello.com/1/members/me/boards` +
          `?key=` +
          username +
          `&token=` +
          password,
      };
      await httpClient.sendRequest(request);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key or Token',
      };
    }
  },
});

export const trello = createPiece({
  displayName: 'Trello',
  description: 'Project management tool for teams',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/trello.png',
  authors: ["Salem-Alaa","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: trelloAuth,
  actions: [createCard, getCard],
  triggers: [cardMovedTrigger, newCardTrigger],
});
