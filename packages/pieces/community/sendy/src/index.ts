import { createPiece } from '@activepieces/pieces-framework';
import { sendyAuth } from './lib/auth';
import { getBrandsAction } from './lib/actions/get-brands';
import { getListsAction } from './lib/actions/get-brand-lists';
import { subscribeAction } from './lib/actions/subscribe';
import { subscribeMultipleAction } from './lib/actions/subscribe-multiple';
import { unsubscribeAction } from './lib/actions/unsubscribe';
import { unsubscribeMultipleAction } from './lib/actions/unsubscribe-multiple';
import { deleteAction } from './lib/actions/delete-subscriber';
import { statusAction } from './lib/actions/get-subscription-status';
import { countAction } from './lib/actions/count-subscriber';
import { createCampaignAction } from './lib/actions/create-campaign';

export const sendy = createPiece({
  displayName: 'Sendy',
  auth: sendyAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendy.png',
  authors: ['joeworkman'],
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
