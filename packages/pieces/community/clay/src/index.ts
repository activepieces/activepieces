import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { clayAuth } from './lib/auth';
import { clayCreateRecordAction } from './lib/actions/create-record';
import { clayUpdateRecordAction } from './lib/actions/update-record';

export const clay = createPiece({
  displayName: 'Clay',
  description: 'GTM workflow platform for enriching data and ingesting table records via webhooks.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://www.clay.com/favicon.ico',
  authors: ['Harmatta'],
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  auth: clayAuth,
  actions: [clayCreateRecordAction, clayUpdateRecordAction],
  triggers: [],
});
