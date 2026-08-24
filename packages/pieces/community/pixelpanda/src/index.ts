import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { pixelpandaAuth } from './lib/auth';
import { pixelpandaRemoveBackgroundAction } from './lib/actions/remove-background';
import { pixelpandaUpscaleImageAction } from './lib/actions/upscale-image';
import { pixelpandaEnhancePhotoAction } from './lib/actions/enhance-photo';
import { pixelpandaEditImageAction } from './lib/actions/edit-image';
import { pixelpandaImageToPromptAction } from './lib/actions/image-to-prompt';
import { pixelpandaGenerateProductPhotosAction } from './lib/actions/generate-product-photos';
import { pixelpandaCreateAdPackAction } from './lib/actions/create-ad-pack';
import { pixelpandaGenerateUgcVideoAction } from './lib/actions/generate-ugc-video';
import { pixelpandaGetJobAction } from './lib/actions/get-job';
import { pixelpandaGetAdPackAction } from './lib/actions/get-ad-pack';
import { pixelpandaGetVideoJobAction } from './lib/actions/get-video-job';

export const pixelpanda = createPiece({
  displayName: 'PixelPanda',
  description: 'AI product photos, virtual try-on, avatars, UGC video, background removal and upscaling',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pixelpanda.png',
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  authors: ['RyanKramer'],
  auth: pixelpandaAuth,
  actions: [
    pixelpandaRemoveBackgroundAction,
    pixelpandaUpscaleImageAction,
    pixelpandaEnhancePhotoAction,
    pixelpandaEditImageAction,
    pixelpandaImageToPromptAction,
    pixelpandaGenerateProductPhotosAction,
    pixelpandaCreateAdPackAction,
    pixelpandaGenerateUgcVideoAction,
    pixelpandaGetJobAction,
    pixelpandaGetAdPackAction,
    pixelpandaGetVideoJobAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://pixelpanda.ai/api/v2',
      auth: pixelpandaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
