import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { triggers } from './lib/triggers';
import { actions } from './lib/actions';
import { calcomAuth } from './lib/auth';

export { calcomAuth };

export const calcom = createPiece({
  displayName: 'Cal.com',
  description: 'Open-source alternative to Calendly',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal.com.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: calcomAuth,
  actions,
  triggers,
});
