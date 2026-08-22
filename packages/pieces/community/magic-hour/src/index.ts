import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { generateImageAction } from './lib/actions/generate-image';
import { getProjectStatusAction } from './lib/actions/get-project-status';
import { imageToVideoAction } from './lib/actions/image-to-video';
import { textToVideoAction } from './lib/actions/text-to-video';
import { magicHourAuth } from './lib/auth';
import { magicHourCommon } from './lib/common';

export const magicHour = createPiece({
  displayName: 'Magic Hour',
  description:
    'AI video and image generation: Sora 2, Veo 3.1, Kling 3.0, Seedance, MiniMax, WAN 2.2, LTX 2.3, GPT Image, Nano Banana Pro and more with one API key.',
  auth: magicHourAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://magichour.ai/logo.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['RhythmP28'],
  actions: [
    textToVideoAction,
    imageToVideoAction,
    generateImageAction,
    getProjectStatusAction,
    createCustomApiCallAction({
      auth: magicHourAuth,
      baseUrl: () => magicHourCommon.baseUrl,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
