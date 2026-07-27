import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from './lib/auth';
import { renderImage } from './lib/actions/render-image';

export const polotnoStudio = createPiece({
  displayName: 'Polotno Studio',
  description: 'Render images and videos from Polotno Studio templates.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://polotno.com/icon.svg',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING],
  auth: polotnoStudioAuth,
  authors: ['polotno'],
  actions: [renderImage],
  triggers: [],
});
