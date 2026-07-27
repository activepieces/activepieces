import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from './lib/auth';
import { renderImage } from './lib/actions/render-image';
import { renderVideo } from './lib/actions/render-video';
import { getImage } from './lib/actions/get-image';
import { getVideo } from './lib/actions/get-video';
import { findTemplates } from './lib/actions/find-templates';
import { getTemplate } from './lib/actions/get-template';
import { imageRendered } from './lib/triggers/image-rendered';
import { videoRendered } from './lib/triggers/video-rendered';
import { renderFailed } from './lib/triggers/render-failed';

export const polotnoStudio = createPiece({
  displayName: 'Polotno Studio',
  description: 'Render images and videos from Polotno Studio templates.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://polotno.com/icon.svg',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING],
  auth: polotnoStudioAuth,
  authors: ['polotno'],
  actions: [renderImage, renderVideo, getImage, getVideo, findTemplates, getTemplate],
  triggers: [imageRendered, videoRendered, renderFailed],
});
