import { createPiece } from '../../framework/piece';
import { convertPdfToText } from './actions/get-text-from-pdf';

export const cloudVisionAI = createPiece({
  name: 'cloudVisionAI',
  displayName: 'Google Cloud Vision AI',
  logoUrl: 'https://cdn.activepieces.com/pieces/googleCloud.png',
  actions: [convertPdfToText],
  triggers: [],
});
