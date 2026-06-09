import { createPiece } from '@activepieces/pieces-framework';
import { flodeskAuth } from './lib/auth';
import { createSubscriberAction } from './lib/actions/create-subscriber';
import { addSubscriberToSegmentAction } from './lib/actions/add-subscriber-to-segment';
import { removeSubscriberFromSegmentAction } from './lib/actions/remove-subscriber-from-segment';
import { createSegmentAction } from './lib/actions/create-segment';
import { listSegmentsAction } from './lib/actions/list-segments';
import { subscriberCreatedTrigger } from './lib/triggers/subscriber-created';
import { subscriberUnsubscribedTrigger } from './lib/triggers/subscriber-unsubscribed';
import { subscriberAddedToSegmentTrigger } from './lib/triggers/subscriber-added-to-segment';

export const flodesk = createPiece({
  displayName: 'Flodesk',
  description: 'Design-first email marketing platform.',
  auth: flodeskAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/flodesk.png',
  authors: ['vonar'],
  actions: [
    createSubscriberAction,
    addSubscriberToSegmentAction,
    removeSubscriberFromSegmentAction,
    createSegmentAction,
    listSegmentsAction,
  ],
  triggers: [
    subscriberCreatedTrigger,
    subscriberUnsubscribedTrigger,
    subscriberAddedToSegmentTrigger,
  ],
});
