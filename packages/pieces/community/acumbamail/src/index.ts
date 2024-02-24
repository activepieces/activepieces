import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { addUpdateSubscriberAction } from './lib/actions/add-subscriber';
import { createSubscriberListAction } from './lib/actions/create-subscriber-list';
import { deleteSubscriberListAction } from './lib/actions/delete-subscriber-list';

export const acumbamailAuth = PieceAuth.SecretText({
  displayName: 'Auth Token',
  required: true,
  description: `
  To obtain your Auth Token, follow these steps:

  1. Login to your Acumbamail account.
  2. Go to **https://acumbamail.com/apidoc/**.
  3. Under **Customer identifier**, you can find auth token;
  `,
});

export const acumbamail = createPiece({
  displayName: 'Acumbamail',
  auth: acumbamailAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/acumbamail.png',
  authors: ['kishanprmr'],
  actions: [addUpdateSubscriberAction, createSubscriberListAction, deleteSubscriberListAction],
  triggers: [],
});
