import { createPiece } from '@activepieces/pieces-framework';
import { getOrdersAction } from './actions/get-orders';
import { getCustomersAction } from './actions/get-customers';
import { getItemsAction } from './actions/get-items';
import { getStockSummariesAction } from './actions/get-stock-summaries';
import { createOrderAction } from './actions/create-order';
import { extensivAuth } from './lib/auth';

export const extensiv = createPiece({
  displayName: 'Extensiv',
  description:
    'Interact with the Extensiv 3PL Warehouse Manager API to retrieve and manage warehouse resources.',
  auth: extensivAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-ses.png',
  authors: ['Zapps Engineering'],
  actions: [getOrdersAction, getCustomersAction,getItemsAction,getStockSummariesAction,createOrderAction],
  triggers: [],
});