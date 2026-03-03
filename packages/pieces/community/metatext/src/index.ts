import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { extractText } from './lib/actions/extract-text';
import { classifyText } from './lib/actions/classify-text';
import { finetuneModel } from './lib/actions/finetune-model';
import { metatextAuth } from './lib/auth';

export const metatext = createPiece({
  displayName: 'Metatext',
  description: 'AI content moderation and safety guard API',
  auth: metatextAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/metatext.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikachi-david'],
  actions: [extractText, classifyText, finetuneModel],
  triggers: [],
});
