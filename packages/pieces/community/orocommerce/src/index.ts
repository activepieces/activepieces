import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { oroAuth } from './lib/common';
import { oroWebhookTopicTrigger } from './lib/triggers/webhook-topic-trigger';
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
  triggers: [oroWebhookTopicTrigger],
});
