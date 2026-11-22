import { HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
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
import { aiCreateAvatarVideo } from './lib/actions/ai/create-avatar-video-ai';
import { aiGetAvatarVideo } from './lib/actions/ai/get-avatar-video';
import { aiCreateTemplateVideo } from './lib/actions/ai/create-template-video';
import { aiGetTemplateVideo } from './lib/actions/ai/get-template-video';
import { aiCreatePhotoAvatar } from './lib/actions/ai/create-photo-avatar';
import { aiGetPhotoAvatarStatus } from './lib/actions/ai/get-photo-avatar-status';
import { aiCreateProduct } from './lib/actions/ai/create-product';
import { aiUpdateProduct } from './lib/actions/ai/update-product';
import { aiListPublicAvatars } from './lib/actions/ai/list-public-avatars';
import { aiListCustomAvatars } from './lib/actions/ai/list-custom-avatars';
import { aiListPhotoAvatars } from './lib/actions/ai/list-photo-avatars';
import { aiListVoices } from './lib/actions/ai/list-voices';
import { aiListTemplates } from './lib/actions/ai/list-templates';
import { aiGetTemplate } from './lib/actions/ai/get-template';
import { aiGetRemainingQuota } from './lib/actions/ai/get-remaining-quota';
import { JoggAiError, joggAiClient } from './lib/common/client';

export const joggAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your JoggAI API key. Create it in the JoggAI dashboard under API.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await joggAiClient.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/v2/user/remaining_quota',
        op: 'validate API key',
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof JoggAiError && error.code === 10105) {
        return { valid: false, error: 'Invalid JoggAI API key.' };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not verify the JoggAI API key.',
      };
    }
  },
});

export const joggAi = createPiece({
  displayName: 'JoggAI',
  description:
    'AI-powered content creation platform for generating avatar photos, videos, and product content using advanced AI technology.',
  auth: joggAiAuth,
  minimumSupportedRelease: '0.86.4',
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
    aiCreateAvatarVideo,
    aiGetAvatarVideo,
    aiCreateTemplateVideo,
    aiGetTemplateVideo,
    aiCreatePhotoAvatar,
    aiGetPhotoAvatarStatus,
    aiCreateProduct,
    aiUpdateProduct,
    aiListPublicAvatars,
    aiListCustomAvatars,
    aiListPhotoAvatars,
    aiListVoices,
    aiListTemplates,
    aiGetTemplate,
    aiGetRemainingQuota,
  ],
  triggers: [videoGeneratedSuccessfully, videoGenerationFailed],
});
