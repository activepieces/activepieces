import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createVideoFromTemplateAction } from './lib/actions/create-a-video-from-template';
import { retrieveTranslatedVideoStatus } from './lib/actions/retrieve-a-translated-video-status';
import { retrieveVideoStatusAction } from './lib/actions/retrieve-a-video-status';
import { retrieveSharableVideoUrlAction } from './lib/actions/retrieve-shareable-link-for-a-video';
import { uploadAssetAction } from './lib/actions/upload-an-asset';
import { translateVideoAction } from './lib/actions/translate-a-video';
import { videoGenerationCompletedTrigger } from './lib/triggers/video-generation-completed';
import { videoGenerationFailedTrigger } from './lib/triggers/video-generation-failed';

import { heygenAuth } from './lib/common/auth';
import { BASE_URL_V1 } from './lib/common/client';

export const heygen = createPiece({
  displayName: 'HeyGen',
  description: 'Generate and manage AI avatar videos using HeyGen.',
  auth: heygenAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/heygen.jpg',
  authors: ['krushnarout'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    createVideoFromTemplateAction,
    retrieveTranslatedVideoStatus,
    retrieveVideoStatusAction,
    retrieveSharableVideoUrlAction,
    uploadAssetAction,
    translateVideoAction,
    createCustomApiCallAction({
      auth: heygenAuth,
      baseUrl: () => BASE_URL_V1,
      authMapping: async (auth) => {
        return {
          'X-Api-Key': auth as string,
        };
      },
    }),
  ],
  triggers: [videoGenerationCompletedTrigger, videoGenerationFailedTrigger],
});
