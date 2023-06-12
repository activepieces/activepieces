
import { createPiece } from '@activepieces/pieces-framework';
import { renderTemplate } from './lib/actions/renderTemplate.action';

export const generatebanners = createPiece({
  displayName: 'GenerateBanners',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  authors: [
  ],
  actions: [
    renderTemplate
  ],
  triggers: [
  ],
});
