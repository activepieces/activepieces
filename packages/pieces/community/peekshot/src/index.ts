import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { captureScreenshot } from './lib/actions/capture-screenshot';
import { PieceCategory } from '@activepieces/shared';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { peekshotAuth } from './lib/auth';

export const peekshot = createPiece({
  displayName: 'PeekShot',
  auth: peekshotAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/peekshot.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['balwant1707'],
  actions: [
    captureScreenshot,
    createCustomApiCallAction({
      auth: peekshotAuth,
      baseUrl: () => 'https://api.peekshot.com/api/v1',
      authMapping: async (auth) => {
        return {
          'x-api-key': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
