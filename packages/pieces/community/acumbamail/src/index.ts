import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { addUpdateSubscriberAction } from './lib/actions/add-subscriber';
import { createSubscriberListAction } from './lib/actions/create-subscriber-list';
import { unsubscribeAction } from './lib/actions/unsubscribe-subscriber';
import { deleteSubscriberListAction } from './lib/actions/delete-subscriber-list';
import { duplicateTemplateAction } from './lib/actions/duplicate-template';
import { searchSubscriberAction } from './lib/actions/search-subscriber';
import { removeSubscribeAction } from './lib/actions/delete-subscriber';

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
  description: 'Easily send email and SMS campaigns and boost your business',
  auth: acumbamailAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/acumbamail.png',
  authors: ["kishanprmr","abuaboud"],
  actions: [
    addUpdateSubscriberAction,
    createSubscriberListAction,
    unsubscribeAction,
    deleteSubscriberListAction,
    duplicateTemplateAction,
    searchSubscriberAction,
    removeSubscribeAction,
  ],
  triggers: [],
});
