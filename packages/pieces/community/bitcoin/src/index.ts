import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { FetchOrdinals } from './lib/action/fetchOrdinals';

export const bitcoin = createPiece({
  displayName: 'Bitcoin',
  description: 'Integrate with Bitcoin blockchain',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  categories: [],
  logoUrl:
    'https://imagedelivery.net/bHREz764QO9n_1kIQUR2sw/961bd367-0c20-42a1-e42b-6cf975a73e00/public',
  authors: ['Swanblocks/Ahmad Shawar'],
  actions: [FetchOrdinals],
  triggers: [],
});
