import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { addUpdateSubscriberAction } from './lib/actions/add-subscriber';
import { createSubscriberListAction } from './lib/actions/create-subscriber-list';
import { unsubscribeAction } from './lib/actions/unsubscribe-subscriber';
import { deleteSubscriberListAction } from './lib/actions/delete-subscriber-list';
import { duplicateTemplateAction } from './lib/actions/duplicate-template';
import { searchSubscriberAction } from './lib/actions/search-subscriber';
import { removeSubscribeAction } from './lib/actions/delete-subscriber';
import { acumbamailAuth } from './lib/auth';

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
