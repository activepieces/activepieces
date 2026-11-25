import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { renderTemplate } from './lib/actions/renderTemplate.action';
import { generatebannersAuth } from './lib/auth';

export const generatebanners = createPiece({
  displayName: 'GenerateBanners',
  description: 'Create banners and social media images from templates.',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ["tpatel","kishanprmr","khaledmashaly","abuaboud"],
  auth: generatebannersAuth,
  actions: [renderTemplate],
  triggers: [],
});
