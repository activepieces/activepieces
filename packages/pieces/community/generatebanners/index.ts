import { createPiece } from '@activepieces/pieces-framework';
import { renderTemplate } from './actions/renderTemplate.action';

export const generatebanners = createPiece({
  name: 'generatebanners',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  authors: ['tpatel'],
  actions: [renderTemplate],
  displayName: 'GenerateBanners',
  triggers: [],
  version: '0.1.0',
});
