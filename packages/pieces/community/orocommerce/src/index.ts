import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { orocommerceAuth } from './lib/common';
import { newOrder } from './lib/triggers/new-order';

export const orocommerce = createPiece({
  displayName: 'OroCommerce',
  auth: orocommerceAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://oroinc.com/wp-content/themes/oroinc/images/redesign/ORO.svg',
  categories: [PieceCategory.COMMERCE],
  description: 'B2B digital commerce solution',
  authors: ['Oro Inc.'],
  actions: [],
  triggers: [
    newOrder
  ],
});
