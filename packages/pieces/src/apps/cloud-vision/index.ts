import { createPiece } from '../../framework/piece';
import { convertPdfToText } from './actions/get-text-from-pdf';

export const cloudVisionAI = createPiece({
  name: 'cloudVisionAI',
  displayName: 'Google Cloud Vision AI',
  logoUrl: 'https://cdn.cdnlogo.com/logos/g/46/google-cloud.png',
  actions: [convertPdfToText],
  triggers: [],
});
