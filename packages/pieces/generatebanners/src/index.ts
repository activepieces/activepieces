
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { renderTemplate } from './lib/actions/renderTemplate.action';

export const generatebanners = createPiece({
  name: 'generatebanners',
  displayName: 'generatebanners',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  version: packageJson.version,
  authors: [
  ],
  actions: [
    renderTemplate
  ],
  triggers: [
  ],
});
