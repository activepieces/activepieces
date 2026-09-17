import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createImageAction } from './lib/actions/create-image';
import { editImageAction } from './lib/actions/edit-image';
import { faceSwapPhotoAction } from './lib/actions/face-swap-photo';
import { generateUploadUrlsAction } from './lib/actions/generate-upload-urls';
import { getAccountAction } from './lib/actions/get-account';
import { getProjectAction } from './lib/actions/get-project';
import { imageToVideoAction } from './lib/actions/image-to-video';
import { talkingPhotoAction } from './lib/actions/talking-photo';
import { textToVideoAction } from './lib/actions/text-to-video';
import { magicHourAuth } from './lib/auth';
import { MAGIC_HOUR_BASE_URL } from './lib/common/client';

export const magicHour = createPiece({
  displayName: 'Magic Hour',
  description:
    'Generate and edit images, videos, and audio with the Magic Hour API.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/magic-hour.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: magicHourAuth,
  authors: ['runshouse'],
  actions: [
    getAccountAction,
    generateUploadUrlsAction,
    createImageAction,
    editImageAction,
    imageToVideoAction,
    textToVideoAction,
    faceSwapPhotoAction,
    talkingPhotoAction,
    getProjectAction,
    createCustomApiCallAction({
      baseUrl: () => MAGIC_HOUR_BASE_URL,
      auth: magicHourAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
