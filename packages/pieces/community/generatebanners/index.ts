import { createPiece } from '@activepieces/pieces-framework';
import { renderTemplate } from './actions/renderTemplate.action';
import { PieceCategory } from '@activepieces/shared';
import { generatebannersAuth } from './src/index';
export const generatebanners = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  authors: ['tpatel'],
  categories: [PieceCategory.MARKETING],
  actions: [renderTemplate],
  displayName: 'GenerateBanners',
  triggers: [],
  auth: generatebannersAuth,
});
