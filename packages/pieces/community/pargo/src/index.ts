import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { pargoAuth } from './lib/auth';
import { createShipmentAction } from './lib/actions/create-shipment.action';
import { getShipmentAction } from './lib/actions/get-shipment.action';
import { listPickupPointsAction } from './lib/actions/list-pickup-points.action';
import { shipmentStatusChangedTrigger } from './lib/triggers/shipment-status-changed.trigger';

export const pargo = createPiece({
  displayName: 'Pargo',
  description:
    'South African pickup-point delivery network. Create shipments to Pargo points, list pickup locations, and track parcels.',
  minimumSupportedRelease: '0.92.0',
  logoUrl: 'https://res.cloudinary.com/dewvhnks3/image/upload/v1791579160/logo_ggfpov.svg',
  categories: [PieceCategory.COMMERCE, PieceCategory.PRODUCTIVITY],
  auth: pargoAuth,
  authors: ['synkra'],
  actions: [createShipmentAction, getShipmentAction, listPickupPointsAction],
  triggers: [shipmentStatusChangedTrigger],
});
