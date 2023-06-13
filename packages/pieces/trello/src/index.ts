
import { createPiece } from '@activepieces/pieces-framework';
import { createCard } from './lib/actions/create-card';
import { getCard } from './lib/actions/get-card';

export const trello = createPiece({
  displayName: 'Trello',
  logoUrl: 'https://cdn.activepieces.com/pieces/trello.png',
  authors: ['ShayPunter'],
  actions: [
    createCard,
    getCard,
  ],
  triggers: [
  ],
});