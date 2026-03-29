import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { productboardAuth } from './lib/auth';
import * as actions from './lib/actions';
import * as triggers from './lib/triggers';

export const productboardPiece = createPiece({
  displayName: 'Productboard',
  description: 'Product management platform for feedback, features, and roadmaps',
  logoUrl: 'https://cdn.productboard.com/favicon.ico',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: productboardAuth,
  actions: Object.values(actions),
  triggers: Object.values(triggers),
});
