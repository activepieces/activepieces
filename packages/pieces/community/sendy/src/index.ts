import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { countAction } from './lib/actions/count-subscriber';
import { createCampaignAction } from './lib/actions/create-campaign';
import { deleteAction } from './lib/actions/delete-subscriber';
import { getListsAction } from './lib/actions/get-brand-lists';
import { getBrandsAction } from './lib/actions/get-brands';
import { statusAction } from './lib/actions/get-subscription-status';
import { subscribeAction } from './lib/actions/subscribe';
import { subscribeMultipleAction } from './lib/actions/subscribe-multiple';
import { unsubscribeAction } from './lib/actions/unsubscribe';
import { unsubscribeMultipleAction } from './lib/actions/unsubscribe-multiple';
import { sendyAuth } from './lib/auth';

export const sendy = createPiece({
  displayName: 'Sendy',
  description: 'Self-hosted email marketing software',
  auth: sendyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendy.png',
  categories: [PieceCategory.MARKETING],
  authors: ["joeworkman","kishanprmr","abuaboud"],
  actions: [
    countAction,
    createCampaignAction,
    deleteAction,
    getBrandsAction,
    getListsAction,
    statusAction,
    subscribeAction,
    subscribeMultipleAction,
    unsubscribeAction,
    unsubscribeMultipleAction,
  ],
  triggers: [],
});

// Sendy APi docs: https://sendy.co/api
