import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { instantVerifyAction } from './lib/actions/instant-verify';
import { clearoutAuth } from './lib/auth';

export const clearout = createPiece({
  displayName: 'Clearout',
  description: 'Bulk email validation and verification',
  auth: clearoutAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clearout.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ["joeworkman","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    instantVerifyAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.clearout.io/v2', // Replace with the actual base URL
      auth: clearoutAuth,
      authMapping: async (auth) => ({
        Authorization: `${(auth as { apiKey: string }).apiKey}`,
      }),
    }),
  ],
  triggers: [],
});

// Clearout API Docs https://docs.clearout.io/api.html
