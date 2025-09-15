import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createAiAvatarPhoto } from './lib/actions/create-ai-avatar-photo';
import { createAvatarVideo } from './lib/actions/create-avatar-video';
import { createProductFromUrl } from './lib/actions/create-product-from-url';
import { createProductFromProductInfo } from './lib/actions/create-product-from-product-info';
import { updateProductInfo } from './lib/actions/update-product-info';
import { getGeneratedVideo } from './lib/actions/get-generated-video';
import { uploadMedia } from './lib/actions/upload-media';
import { createVideoFromTemplate } from './lib/actions/create-video-from-template';
import { videoGeneratedSuccessfully } from './lib/triggers/video-generation-events';
import { videoGenerationFailed } from './lib/triggers/video-generation-failed';

export const joggAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Jogg AI API Key',
  required: true,
});

export const joggAi = createPiece({
  displayName: 'JoggAI',
  description:
    'AI-powered content creation platform for generating avatar photos, videos, and product content using advanced AI technology.',
  auth: joggAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/jogg-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.MARKETING],
  authors: ['fortunamide', 'onyedikachi-david'],
  actions: [
    createAiAvatarPhoto,
    createAvatarVideo,
    createProductFromUrl,
    createProductFromProductInfo,
    updateProductInfo,
    getGeneratedVideo,
    uploadMedia,
    createVideoFromTemplate,
  ],
  triggers: [videoGeneratedSuccessfully, videoGenerationFailed],
});
