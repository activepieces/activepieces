import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { bobGoAuth } from './lib/auth';
import { createShipmentAction } from './lib/actions/create-shipment.action';
import { getShipmentAction } from './lib/actions/get-shipment.action';
import { getQuotesAction } from './lib/actions/get-quotes.action';
import { shipmentStatusChangedTrigger } from './lib/triggers/shipment-status-changed.trigger';

export const bobGo = createPiece({
  displayName: 'Bob Go',
  description:
    'South African courier aggregator. Compare rates across multiple couriers, create shipments, and track parcels.',
  minimumSupportedRelease: '0.92.0',
  logoUrl: 'https://res.cloudinary.com/dewvhnks3/image/upload/v1791579160/images_6_ytwewj.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.PRODUCTIVITY],
  auth: bobGoAuth,
  authors: ['synkra'],
  actions: [createShipmentAction, getShipmentAction, getQuotesAction],
  triggers: [shipmentStatusChangedTrigger],
});
