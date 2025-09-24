import { createPiece } from '@activepieces/pieces-framework';
import { analyzeAudio } from './lib/actions/analyze-audio';
import { analyzeDocument } from './lib/actions/analyze-document';
import { analyzeImage } from './lib/actions/analyze-image';
import { analyzeVideo } from './lib/actions/analyze-video';
import { getFile } from './lib/actions/get-file';
import { vlmRunAuth } from './lib/common';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

export const vlmRun = createPiece({
  displayName: 'VLM Run',
  description:
    'VLM Run is a visual AI platform that extracts data from images, videos, audio, and documents. It helps automate analysis workflows, such as object detection, transcription, image/audio analysis, and document parsing.',
  auth: vlmRunAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
  logoUrl: 'https://cdn.activepieces.com/pieces/vlm-run.png',
  authors: ['LuizDMM', 'sanket-a11y'],
  actions: [
    analyzeAudio,
    analyzeImage,
    analyzeDocument,
    analyzeVideo,
    getFile,
    createCustomApiCallAction({
      auth: vlmRunAuth,
      baseUrl: () => 'https://api.vlm.run/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});
