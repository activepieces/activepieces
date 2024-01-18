import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { advancedMapping } from './lib/actions/advanced-mapping';

export const dataMapper = createPiece({
  displayName: 'Data Mapper',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/data-mapper.png',
  auth: PieceAuth.None(),
  authors: ['abuaboud'],
  actions: [advancedMapping],
  triggers: [],
});
