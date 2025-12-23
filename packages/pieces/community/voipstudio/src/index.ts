import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { voipstudioAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';

export const voipstudio = createPiece({
  displayName: 'Voipstudio',
  auth: voipstudioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/voipstudio.png',
  categories: [PieceCategory.COMMUNICATION],
  description:
    'VoIPstudio is a complete business phone system and scalable call center',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [],
});
