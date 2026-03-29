import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { meistertaskAuth } from './lib/auth';
import * as actions from './lib/actions';
import * as triggers from './lib/triggers';

export const meistertaskPiece = createPiece({
  displayName: 'MeisterTask',
  description: 'Task management platform for teams',
  logoUrl: 'https://www.meistertask.com/favicon.ico',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: meistertaskAuth,
  actions: Object.values(actions),
  triggers: Object.values(triggers),
});
