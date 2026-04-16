import {
  HttpMethod,
  HttpRequest,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCard } from './lib/actions/card/create-card';
import { getCard } from './lib/actions/card/get-card';
import { updateCard } from './lib/actions/card/update-card';
import { deleteCard } from './lib/actions/card/delete-card';
import { getCardAttachments } from './lib/actions/card-attachment/get-card-attachments';
import { addCardAttachment } from './lib/actions/card-attachment/add-card-attachment';
import { getCardAttachment } from './lib/actions/card-attachment/get-card-attachment';
import { deleteCardAttachment } from './lib/actions/card-attachment/delete-card-attachment';
import { cardMovedTrigger } from './lib/triggers/cardMoved';
import { newCardTrigger } from './lib/triggers/newCard';
import { deadlineTrigger } from './lib/triggers/deadline';

const markdownProperty = `
To obtain your API key and token, follow these steps:

1. Go to https://trello.com/power-ups/admin.
2. Click **New** to create a new power-up.
3. Enter power-up information, and click **Create**.
4. From the API Key page, click **Generate a new API key**.
5. Copy **API Key** and enter it into the Trello API Key connection.
6. On the right side of the page, find the text *"you can manually generate a Token"* and click the **Token** link.**Do not use the Secret field below the API key**.
7. Authorize the app and copy the generated token.
8. Paste the token into the Trello Token field.
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
  authors: ["Salem-Alaa", "kishanprmr", "MoShizzle", "khaledmashaly", "abuaboud", "AshotZaqoyan"],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: trelloAuth,
  actions: [createCard, getCard, updateCard, deleteCard, getCardAttachments, addCardAttachment, getCardAttachment, deleteCardAttachment,
    createCustomApiCallAction({
      auth: trelloAuth,
      baseUrl: () => 'https://api.trello.com/1',
      authLocation: 'queryParams',
      authMapping: async (auth) => {
        return {
          key: auth.username,
          token: auth.password
        }
      }
    })
  ],
  triggers: [cardMovedTrigger, newCardTrigger, deadlineTrigger],
});
