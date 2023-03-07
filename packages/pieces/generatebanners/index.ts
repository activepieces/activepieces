import { createPiece } from '@activepieces/framework';
import { renderTemplate } from './actions/renderTemplate.action';

export const generatebanners = createPiece({
  name: 'generatebanners',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  authors: ['tpatel'],
  actions: [renderTemplate],
  displayName: 'GenerateBanners',
  triggers: [],
  version: '0.1.0',
});
