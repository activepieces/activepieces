import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { foreplayAuth } from './lib/auth';
import * as actions from './lib/actions';
import * as triggers from './lib/triggers';

export const foreplayPiece = createPiece({
  displayName: 'Foreplay',
  description: 'Competitive advertising data and creative insights platform',
  logoUrl: 'https://www.foreplay.co/favicon.ico',
  categories: [PieceCategory.MARKETING],
  auth: foreplayAuth,
  actions: Object.values(actions),
  triggers: Object.values(triggers),
});
