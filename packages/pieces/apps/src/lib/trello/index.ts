import { createPiece } from '@activepieces/framework';
import { createCard } from './actions/create-card';
import { getCard } from './actions/get-card';

export const trello = createPiece({
  name: 'trello',
  displayName: 'Trello',
  logoUrl: 'https://cdn.activepieces.com/pieces/trello.png',
  authors: ['ShayPunter'],
  actions: [
    createCard,
    getCard,
  ],
  triggers: [],
  version: "1.0"
});