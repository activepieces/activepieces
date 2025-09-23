import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { generateVideo } from './lib/actions/generate-video';
import { generatePodcast } from './lib/actions/generate-podcast';
import { generateAiImage } from './lib/actions/generate-ai-image';
import { generateAiCaptions } from './lib/actions/generate-ai-captions';

export const vadooAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your Vadoo AI API key'
});

export const vadooAi = createPiece({
  displayName: 'Vadoo AI',
  auth: vadooAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vadoo-ai.png',
  authors: [],
  actions: [generateVideo, generatePodcast, generateAiImage, generateAiCaptions],
  triggers: []
});
