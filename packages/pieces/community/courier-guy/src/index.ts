import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { courierGuyAuth } from './lib/auth';
import { createShipmentAction } from './lib/actions/create-shipment.action';
import { getShipmentAction } from './lib/actions/get-shipment.action';
import { getRatesAction } from './lib/actions/get-rates.action';
import { shipmentStatusChangedTrigger } from './lib/triggers/shipment-status-changed.trigger';

export const courierGuy = createPiece({
  displayName: 'The Courier Guy',
  description:
    "South Africa's largest courier. Create shipments, fetch rates, track parcels, and react to status changes.",
  minimumSupportedRelease: '0.92.0',
  logoUrl: 'https://res.cloudinary.com/dewvhnks3/image/upload/v1791579160/The-courier-guy_zjtqqc.jpg',
  categories: [PieceCategory.COMMERCE, PieceCategory.PRODUCTIVITY],
  auth: courierGuyAuth,
  authors: ['synkra'],
  actions: [createShipmentAction, getShipmentAction, getRatesAction],
  triggers: [shipmentStatusChangedTrigger],
});
