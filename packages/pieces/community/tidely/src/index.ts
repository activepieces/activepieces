import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { importInvoice } from './lib/actions/import-invoice';
import { tidelyAuth } from './lib/common/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const tidely = createPiece({
  displayName: 'Tidely',
  auth: tidelyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tidely.png',
  authors: ['sanket-a11y'],
  actions: [
    importInvoice,
    createCustomApiCallAction({
      auth: tidelyAuth,
      baseUrl: () => 'https://api.tidely.com/api/v1',
      authMapping: async (auth) => {
        return {
          'X-Authorization': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
