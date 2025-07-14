import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { delayAfterQueue } from './lib/actions/delay-after-queue';

export const delayAfterQueuePiece = createPiece({
  displayName: 'Delay After Queue',
  description: 'Rate control piece that processes flows sequentially with configurable delays',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://dallasreynoldstn.com/wp-content/uploads/2025/07/ChatGPT-Image-Jul-10-2025-11_04_37-PM.svg',
  authors: ['Dallas Reynolds Homes Inc'],
  categories: [PieceCategory.CORE],
  actions: [delayAfterQueue],
  triggers: [],
});
