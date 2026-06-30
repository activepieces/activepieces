import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { transcribeAction } from './lib/actions/transcribe';
import { funasrAuth } from './lib/auth';

export const funasr = createPiece({
  displayName: 'FunASR',
  description: 'Self-hosted speech recognition with 50+ languages.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/funasr.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: funasrAuth,
  actions: [transcribeAction],
  authors: ['gouthamx67'],
  triggers: [],
});
