
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCard } from './lib/actions/create-card';
import { getCard } from './lib/actions/get-card';


const markdownProperty = `
To obtain your API key and token, follow these steps:

1. Go to https://trello.com/app-key
2. Copy **Personal Key** and enter it into the Trello API Key connection
3. Click **generate a Token** in trello
4. Copy the token and paste it into the Trello Token connection
5. Your connection should now work!
`
export const trelloAuth = PieceAuth.BasicAuth({
    description: markdownProperty,
    displayName: "Trello Connection",
    required: true,
    username: {
        displayName: "API Key",
        description: "Trello API Key",
    },
    password: {
        displayName: "Token",
        description: "Trello Token",
    }
})

export const trello = createPiece({
  displayName: 'Trello',
  logoUrl: 'https://cdn.activepieces.com/pieces/trello.png',
  authors: ['ShayPunter'],
  auth: trelloAuth,
  actions: [
    createCard,
    getCard,
  ],
  triggers: [
  ],
});
