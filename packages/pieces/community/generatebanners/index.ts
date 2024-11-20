import { createPiece } from '@activepieces/pieces-framework';
import { renderTemplate } from './actions/renderTemplate.action';
import { PieceCategory } from '@activepieces/shared';
export const generatebanners = createPiece({
  name: 'generatebanners',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  authors: ['tpatel'],
  categories: [PieceCategory.MARKETING],
  actions: [renderTemplate],
  displayName: 'GenerateBanners',
  triggers: [],
  version: '0.1.0',
});
