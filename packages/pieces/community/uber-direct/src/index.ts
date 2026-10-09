import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { uberDirectAuth } from './lib/auth';
import { createDeliveryAction } from './lib/actions/create-delivery.action';
import { getDeliveryAction } from './lib/actions/get-delivery.action';
import { cancelDeliveryAction } from './lib/actions/cancel-delivery.action';
import { deliveryStatusChangedTrigger } from './lib/triggers/delivery-status-changed.trigger';

export const uberDirect = createPiece({
  displayName: 'Uber Direct',
  description:
    'On-demand local delivery via Uber. Create deliveries, track couriers, and react to delivery status changes.',
  minimumSupportedRelease: '0.92.0',
  logoUrl: 'https://res.cloudinary.com/dewvhnks3/image/upload/v1791579160/images_7_cjqdps.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.PRODUCTIVITY],
  auth: uberDirectAuth,
  authors: ['synkra'],
  actions: [createDeliveryAction, getDeliveryAction, cancelDeliveryAction],
  triggers: [deliveryStatusChangedTrigger],
});
