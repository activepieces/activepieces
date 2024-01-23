import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { webflowNewSubmission } from './lib/triggers/new-form-submitted';
import { webflowCreateCollectionItem } from './lib/actions/create-collection-item';
import { webflowDeleteCollectionItem } from './lib/actions/delete-collection-item';
import { webflowUpdateCollectionItem } from './lib/actions/update-collection-item';
import { webflowFindCollectionItem } from './lib/actions/find-collection-item';
import { webflowGetCollectionItem } from './lib/actions/get-collection-item';
import { webflowFulfillOrder } from './lib/actions/fulfill-order';
import { webflowUnfulfillOrder } from './lib/actions/unfulfill-order';
import { webflowRefundOrder } from './lib/actions/refund-order';
import { webflowFindOrder } from './lib/actions/find-order';

export const webflowAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://webflow.com/oauth/authorize',
  tokenUrl: 'https://api.webflow.com/oauth/access_token',
  required: true,
  scope: ['webhooks:write', 'forms:read'],
});

export const webflow = createPiece({
  displayName: 'Webflow',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/webflow.png',
  authors: ['Ahmad-AbuOsbeh', 'TaskMagicKyle'],
  auth: webflowAuth,
  actions: [
    webflowCreateCollectionItem,
    webflowDeleteCollectionItem,
    webflowUpdateCollectionItem,
    webflowFindCollectionItem,
    webflowGetCollectionItem,
    webflowFulfillOrder,
    webflowUnfulfillOrder,
    webflowRefundOrder,
    webflowFindOrder,
  ],
  triggers: [webflowNewSubmission],
});
