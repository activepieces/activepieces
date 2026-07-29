import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from './lib/auth';
import { findTemplates } from './lib/actions/find-templates';
import { getImage } from './lib/actions/get-image';
import { getTemplate } from './lib/actions/get-template';
import { getVideo } from './lib/actions/get-video';
import { renderImage } from './lib/actions/render-image';
import { renderVideo } from './lib/actions/render-video';
import { polotnoConstants } from './lib/common/constants';
import { imageRendered } from './lib/triggers/image-rendered';
import { renderFailed } from './lib/triggers/render-failed';
import { videoRendered } from './lib/triggers/video-rendered';

export const polotnoStudio = createPiece({
  displayName: 'Polotno Studio',
  description: 'Render images and videos from Polotno Studio templates.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://polotno.com/icon.svg',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING],
  auth: polotnoStudioAuth,
  authors: ['polotno'],
  actions: [
    renderImage,
    renderVideo,
    getImage,
    getVideo,
    findTemplates,
    getTemplate,
    createCustomApiCallAction({
      auth: polotnoStudioAuth,
      baseUrl: () => polotnoConstants.BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [imageRendered, videoRendered, renderFailed],
});
