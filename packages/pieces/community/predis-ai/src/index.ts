import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { predisAiActions } from './lib/actions';
import { predisAiTriggers } from './lib/triggers';

export const predisAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'In Predis.ai, go to Pricing & Account -> Rest API to generate an API key.',
});

export const predisAi = createPiece({
  displayName: 'Predis.ai',
  description: 'AI-powered social media content creation platform. Generate posts, videos, carousels, images, quotes, and memes with automated creation and webhook notifications.',
  auth: predisAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/predis-ai.png',
  authors: ['onyedikachi-david'],
  actions: predisAiActions,
  triggers: predisAiTriggers,
});