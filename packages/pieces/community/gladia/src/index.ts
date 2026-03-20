import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createTranscription } from './lib/actions/create-transcription';
import { uploadAFile } from './lib/actions/upload-a-file';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { gladiaAuth } from './lib/common/auth';

export const gladia = createPiece({
  displayName: 'Gladia',
  auth: gladiaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/gladia.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [
    createTranscription,
    uploadAFile,
    createCustomApiCallAction({
      baseUrl: () => `https://api.gladia.io/v2`,
      auth: gladiaAuth,
      authMapping: async (auth) => ({
        'x-gladia-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
