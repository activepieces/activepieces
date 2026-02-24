import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { oroAuth } from './lib/common';
import { newOrder, removedOrder, updatedOrder } from './lib/triggers/order';
import {
  newInvoice,
  removedInvoice,
  updatedInvoice,
} from './lib/triggers/invoice';
import {
  createInvoiceAction,
  createOrderAction,
  apiCallAction,
  serializeJsonApiAction,
  unserializeJsonApiAction,
} from './lib/actions';

export const orocommerce = createPiece({
  displayName: 'OroCommerce',
  auth: oroAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://oroinc.com/wp-content/themes/oroinc/images/redesign/ORO.svg',
  categories: [PieceCategory.COMMERCE],
  description: 'B2B digital commerce solution',
  authors: ['Oro Inc.'],
  actions: [
    createInvoiceAction,
    createOrderAction,
    apiCallAction,
    serializeJsonApiAction,
    unserializeJsonApiAction,
  ],
  triggers: [
    newOrder,
    removedOrder,
    updatedOrder,
    newInvoice,
    removedInvoice,
    updatedInvoice,
  ],
});
