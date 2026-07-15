import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { daoxeAuth } from './lib/auth';
import { askDaoxe } from './lib/actions/ask-daoxe';

export const daoxe = createPiece({
  displayName: 'DaoXE',
  description:
    'Multi-model multi-protocol AI API gateway (OpenAI-compatible Chat Completions).',
  auth: daoxeAuth,
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://daoxe.com/logo.png',
  authors: ['seven7763'],
  actions: [askDaoxe],
  triggers: [],
});
